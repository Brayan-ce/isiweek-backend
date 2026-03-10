import db from "../../../_Db/db.js"

export async function getDatosCuota(empresaId) {
  const [clientes, metodosPago, cajas] = await Promise.all([
    db.clientes.findMany({
      where: { empresa_id: empresaId },
      select: { id: true, nombre: true, cedula_rnc: true, telefono: true },
      orderBy: { nombre: "asc" },
    }),
    db.metodos_pago.findMany({
      select: { id: true, nombre: true },
    }),
    db.cajas_sesiones.findMany({
      where: {
        estado: "abierta",
        caja: { empresa_id: empresaId },
      },
      include: { caja: { select: { id: true, nombre: true } } },
    }),
  ])
  return { clientes, metodosPago, cajas }
}

export async function crearVentaCuotas(empresaId, usuarioId, body) {
  const { cliente_id, concepto, monto_total, cuotas } = body

  if (!cliente_id) throw new Error("El cliente es obligatorio")
  if (!concepto?.trim()) throw new Error("El concepto es obligatorio")
  if (!monto_total || Number(monto_total) <= 0) throw new Error("El monto total debe ser mayor a 0")
  if (!cuotas?.length) throw new Error("Debes definir al menos una cuota")

  const sumaCuotas = cuotas.reduce((a, c) => a + Number(c.monto), 0)
  if (Math.abs(sumaCuotas - Number(monto_total)) > 0.01)
    throw new Error(`La suma de cuotas (${sumaCuotas}) no coincide con el total (${monto_total})`)

  return db.$transaction(async tx => {
    const venta = await tx.ventas.create({
      data: {
        empresa_id: empresaId,
        usuario_id: usuarioId,
        cliente_id: Number(cliente_id),
        subtotal: Number(monto_total),
        itbis: 0,
        descuento: 0,
        total: Number(monto_total),
        efectivo_recibido: 0,
        es_pago_mixto: false,
        estado: "pendiente",
      },
    })

    await tx.venta_detalles.create({
      data: {
        venta_id: venta.id,
        nombre_producto: concepto.trim(),
        cantidad: 1,
        precio_unitario: Number(monto_total),
        itbis: 0,
        descuento: 0,
        subtotal: Number(monto_total),
      },
    })

    await tx.venta_cuotas.createMany({
      data: cuotas.map((c, i) => ({
        venta_id: venta.id,
        empresa_id: empresaId,
        numero: i + 1,
        monto: Number(c.monto),
        estado: "pendiente",
      })),
    })

    return tx.ventas.findUnique({
      where: { id: venta.id },
      include: {
        cliente: { select: { nombre: true, cedula_rnc: true } },
        usuario: { select: { nombre_completo: true } },
        venta_cuotas: { orderBy: { numero: "asc" } },
      },
    })
  })
}

export async function getVentasCuotas(empresaId, filtros = {}) {
  const { cliente_id, estado, fecha_desde, fecha_hasta, usuario_id, pagina = 1, limite = 20 } = filtros
  const skip = (Number(pagina) - 1) * Number(limite)

  const where = {
    empresa_id: empresaId,
    venta_cuotas: { some: {} },
    ...(cliente_id ? { cliente_id: Number(cliente_id) } : {}),
    ...(usuario_id ? { usuario_id: Number(usuario_id) } : {}),
    ...(fecha_desde || fecha_hasta ? {
      created_at: {
        ...(fecha_desde ? { gte: new Date(fecha_desde) } : {}),
        ...(fecha_hasta ? { lte: new Date(fecha_hasta + "T23:59:59") } : {}),
      },
    } : {}),
  }

  const ventas = await db.ventas.findMany({
    where,
    skip,
    take: Number(limite),
    orderBy: { created_at: "desc" },
    include: {
      cliente: { select: { nombre: true, cedula_rnc: true, telefono: true } },
      usuario: { select: { nombre_completo: true } },
      venta_cuotas: { orderBy: { numero: "asc" } },
    },
  })

  const total = await db.ventas.count({ where })

  const ventasFiltradas = ventas.filter(v => {
    if (!estado) return true
    const cuotas = v.venta_cuotas
    const todasPagadas = cuotas.every(c => c.estado === "pagada")
    const algunaPendiente = cuotas.some(c => c.estado === "pendiente")
    if (estado === "completa") return todasPagadas
    if (estado === "pendiente") return algunaPendiente
    return true
  })

  return {
    ventas: ventasFiltradas.map(v => ({
      ...v,
      cuotas_pagadas: v.venta_cuotas.filter(c => c.estado === "pagada").length,
      cuotas_total: v.venta_cuotas.length,
      monto_pagado: v.venta_cuotas.filter(c => c.estado === "pagada").reduce((a, c) => a + Number(c.monto), 0),
      monto_pendiente: v.venta_cuotas.filter(c => c.estado === "pendiente").reduce((a, c) => a + Number(c.monto), 0),
    })),
    total,
    paginas: Math.ceil(total / Number(limite)),
  }
}

export async function pagarCuota(empresaId, cuotaId, body) {
  const { caja_sesion_id } = body

  const cuota = await db.venta_cuotas.findFirst({
    where: { id: Number(cuotaId), empresa_id: empresaId },
    include: { venta: true },
  })

  if (!cuota) throw new Error("Cuota no encontrada")
  if (cuota.estado === "pagada") throw new Error("Esta cuota ya fue pagada")

  return db.$transaction(async tx => {
    const cuotaActualizada = await tx.venta_cuotas.update({
      where: { id: Number(cuotaId) },
      data: { estado: "pagada", pagada_at: new Date() },
    })

    if (caja_sesion_id) {
      await tx.cajas_sesiones.update({
        where: { id: Number(caja_sesion_id) },
        data: { caja: { update: { saldo_actual: { increment: Number(cuota.monto) } } } },
      })
    }

    const cuotasRestantes = await tx.venta_cuotas.count({
      where: { venta_id: cuota.venta_id, estado: "pendiente" },
    })

    if (cuotasRestantes === 0) {
      await tx.ventas.update({
        where: { id: cuota.venta_id },
        data: { estado: "completada" },
      })
    }

    return cuotaActualizada
  })
}

export async function editarEstadoCuota(empresaId, cuotaId, estado) {
  const cuota = await db.venta_cuotas.findFirst({
    where: { id: Number(cuotaId), empresa_id: empresaId },
  })
  if (!cuota) throw new Error("Cuota no encontrada")

  return db.$transaction(async tx => {
    const updated = await tx.venta_cuotas.update({
      where: { id: Number(cuotaId) },
      data: {
        estado,
        pagada_at: estado === "pagada" ? new Date() : null,
      },
    })

    const cuotas = await tx.venta_cuotas.findMany({
      where: { venta_id: cuota.venta_id },
    })
    const todasPagadas = cuotas.every(c => c.estado === "pagada")
    await tx.ventas.update({
      where: { id: cuota.venta_id },
      data: { estado: todasPagadas ? "completada" : "pendiente" },
    })

    return updated
  })
}

export async function getVentaCuota(ventaId, empresaId) {
  const venta = await db.ventas.findFirst({
    where: { id: Number(ventaId), empresa_id: empresaId },
    include: {
      empresa: { select: { nombre: true, rnc: true, telefono: true, direccion: true, moneda: { select: { simbolo: true, codigo: true } } } },
      cliente: { select: { nombre: true, cedula_rnc: true, telefono: true } },
      usuario: { select: { nombre_completo: true } },
      venta_cuotas: { orderBy: { numero: "asc" } },
      venta_detalles: true,
    },
  })
  if (!venta) throw new Error("Venta no encontrada")
  return venta
}

export async function getUsuariosEmpresa(empresaId) {
  return db.usuarios.findMany({
    where: { empresa_id: empresaId, estado: "activo" },
    select: { id: true, nombre_completo: true },
    orderBy: { nombre_completo: "asc" },
  })
}