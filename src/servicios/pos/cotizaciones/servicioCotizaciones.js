import db from "../../../_Db/db.js"

export async function getCotizaciones(empresaId, query = {}) {
  const { busqueda = "", estado = "", pagina = "1", limite = "20" } = query
  const skip = (Number(pagina) - 1) * Number(limite)

  const where = {
    empresa_id: empresaId,
    ...(estado ? { estado } : {}),
    ...(busqueda ? {
      OR: [
        { cliente: { nombre: { contains: busqueda } } },
        { id: isNaN(Number(busqueda)) ? undefined : Number(busqueda) },
      ].filter(Boolean),
    } : {}),
  }

  const [cotizaciones, total] = await Promise.all([
    db.cotizaciones.findMany({
      where,
      skip,
      take: Number(limite),
      orderBy: { created_at: "desc" },
      include: {
        cliente:          { select: { id: true, nombre: true, cedula_rnc: true, telefono: true } },
        usuario:          { select: { id: true, nombre_completo: true } },
        cotizacion_items: { select: { id: true } },
      },
    }),
    db.cotizaciones.count({ where }),
  ])

  return { cotizaciones, total, paginas: Math.ceil(total / Number(limite)) }
}

export async function getCotizacion(id) {
  const cotizacion = await db.cotizaciones.findUnique({
    where: { id },
    include: {
      cliente:          { select: { id: true, nombre: true, cedula_rnc: true, telefono: true, email: true, direccion: true } },
      usuario:          { select: { id: true, nombre_completo: true } },
      empresa:          { select: { nombre: true, rnc: true, telefono: true, direccion: true, email: true, moneda: { select: { simbolo: true, codigo: true } } } },
      cotizacion_items: {
        include: { producto: { select: { id: true, nombre: true, codigo: true, precio: true, stock: true } } },
      },
    },
  })
  if (!cotizacion) throw new Error("Cotizacion no encontrada")
  return cotizacion
}

export async function getDatosCotizar(empresaId, usuarioId) {
  const [clientes, productos, moneda] = await Promise.all([
    db.clientes.findMany({
      where: { empresa_id: empresaId },
      select: { id: true, nombre: true, cedula_rnc: true, telefono: true, email: true },
      orderBy: { nombre: "asc" },
    }),
    db.productos.findMany({
      where: { empresa_id: empresaId, activo: true },
      select: { id: true, nombre: true, codigo: true, precio: true, stock: true, itbis_pct: true, categoria: { select: { nombre: true } } },
      orderBy: { nombre: "asc" },
    }),
    db.empresas.findUnique({
      where: { id: empresaId },
      select: { moneda: { select: { simbolo: true, codigo: true } } },
    }),
  ])
  return { clientes, productos, moneda: moneda?.moneda ?? { simbolo: "RD$", codigo: "DOP" } }
}

export async function crearCotizacion(empresaId, usuarioId, body) {
  const { cliente_id, notas = "", items, descuento_global = 0 } = body
  if (!items?.length) throw new Error("La cotizacion no tiene productos")

  const ids   = items.map(i => i.producto_id).filter(Boolean)
  const prods = await db.productos.findMany({
    where: { id: { in: ids }, empresa_id: empresaId, activo: true },
    select: { id: true, nombre: true, precio: true, itbis_pct: true },
  })
  const mapa = Object.fromEntries(prods.map(p => [p.id, p]))

  let subtotal = 0, itbis = 0
  const detalles = items.map(item => {
    const prod = item.producto_id ? mapa[item.producto_id] : null
    const nombre = prod?.nombre ?? item.nombre_producto
    if (!nombre) throw new Error("Producto sin nombre")
    const precioUnit = Number(item.precio_unitario ?? prod?.precio ?? 0)
    const itbisPct   = Number(prod?.itbis_pct ?? 18) / 100
    const itbisItem  = precioUnit * itbisPct * item.cantidad
    const sub        = precioUnit * item.cantidad
    subtotal += sub
    itbis    += itbisItem
    return {
      producto_id:     item.producto_id ?? null,
      nombre_producto: nombre,
      cantidad:        item.cantidad,
      precio_unitario: precioUnit,
      itbis:           itbisItem,
      descuento:       Number(item.descuento ?? 0),
      subtotal:        sub,
    }
  })

  const descuento = Number(descuento_global)
  const total     = subtotal + itbis - descuento

  return db.cotizaciones.create({
    data: {
      empresa_id: empresaId,
      usuario_id: usuarioId,
      cliente_id: cliente_id ?? null,
      subtotal,
      itbis,
      descuento,
      total,
      notas,
      estado: "pendiente",
      cotizacion_items: { createMany: { data: detalles } },
    },
    include: {
      cliente:          { select: { id: true, nombre: true } },
      cotizacion_items: true,
    },
  })
}

export async function actualizarCotizacion(id, empresaId, body) {
  const cotizacion = await db.cotizaciones.findFirst({ where: { id, empresa_id: empresaId } })
  if (!cotizacion) throw new Error("Cotizacion no encontrada")
  if (cotizacion.estado !== "pendiente") throw new Error("Solo se pueden editar cotizaciones pendientes")

  const { cliente_id, notas = "", items, descuento_global = 0 } = body
  if (!items?.length) throw new Error("La cotizacion no tiene productos")

  const ids   = items.map(i => i.producto_id).filter(Boolean)
  const prods = await db.productos.findMany({
    where: { id: { in: ids }, empresa_id: empresaId, activo: true },
    select: { id: true, nombre: true, precio: true, itbis_pct: true },
  })
  const mapa = Object.fromEntries(prods.map(p => [p.id, p]))

  let subtotal = 0, itbis = 0
  const detalles = items.map(item => {
    const prod = item.producto_id ? mapa[item.producto_id] : null
    const nombre = prod?.nombre ?? item.nombre_producto
    if (!nombre) throw new Error("Producto sin nombre")
    const precioUnit = Number(item.precio_unitario ?? prod?.precio ?? 0)
    const itbisPct   = Number(prod?.itbis_pct ?? 18) / 100
    const itbisItem  = precioUnit * itbisPct * item.cantidad
    const sub        = precioUnit * item.cantidad
    subtotal += sub
    itbis    += itbisItem
    return {
      producto_id:     item.producto_id ?? null,
      nombre_producto: nombre,
      cantidad:        item.cantidad,
      precio_unitario: precioUnit,
      itbis:           itbisItem,
      descuento:       Number(item.descuento ?? 0),
      subtotal:        sub,
    }
  })

  const descuento = Number(descuento_global)
  const total     = subtotal + itbis - descuento

  return db.$transaction(async tx => {
    await tx.cotizacion_items.deleteMany({ where: { cotizacion_id: id } })
    return tx.cotizaciones.update({
      where: { id },
      data: {
        cliente_id: cliente_id ?? null,
        notas,
        subtotal,
        itbis,
        descuento,
        total,
        cotizacion_items: { createMany: { data: detalles } },
      },
      include: {
        cliente:          { select: { id: true, nombre: true } },
        cotizacion_items: true,
      },
    })
  })
}

export async function cambiarEstadoCotizacion(id, empresaId, estado) {
  const estados = ["pendiente", "aprobada", "rechazada", "vencida"]
  if (!estados.includes(estado)) throw new Error("Estado invalido")
  const cotizacion = await db.cotizaciones.findFirst({ where: { id, empresa_id: empresaId } })
  if (!cotizacion) throw new Error("Cotizacion no encontrada")
  return db.cotizaciones.update({ where: { id }, data: { estado } })
}

export async function eliminarCotizacion(id, empresaId) {
  const cotizacion = await db.cotizaciones.findFirst({ where: { id, empresa_id: empresaId } })
  if (!cotizacion) throw new Error("Cotizacion no encontrada")
  if (cotizacion.estado === "aprobada") throw new Error("No se puede eliminar una cotizacion aprobada")
  await db.cotizacion_items.deleteMany({ where: { cotizacion_id: id } })
  await db.cotizaciones.delete({ where: { id } })
}

export async function convertirAVenta(id, empresaId, usuarioId, body) {
  const cotizacion = await db.cotizaciones.findFirst({
    where: { id, empresa_id: empresaId },
    include: { cotizacion_items: true },
  })
  if (!cotizacion) throw new Error("Cotizacion no encontrada")
  if (cotizacion.estado === "rechazada") throw new Error("No se puede convertir una cotizacion rechazada")

  const { caja_sesion_id, metodo_pago_id, comprobante_id, efectivo_recibido } = body
  if (!caja_sesion_id) throw new Error("No hay caja activa")
  if (!metodo_pago_id) throw new Error("Selecciona un metodo de pago")

  const items = cotizacion.cotizacion_items

  const prodIds = items.map(i => i.producto_id).filter(Boolean)
  const prods   = await db.productos.findMany({
    where: { id: { in: prodIds }, empresa_id: empresaId, activo: true },
    select: { id: true, nombre: true, stock: true },
  })
  const mapaStock = Object.fromEntries(prods.map(p => [p.id, p]))

  for (const item of items) {
    if (item.producto_id) {
      const p = mapaStock[item.producto_id]
      if (!p) throw new Error(`Producto no encontrado`)
      if (p.stock < item.cantidad) throw new Error(`Stock insuficiente para ${p.nombre}`)
    }
  }

  return db.$transaction(async tx => {
    const v = await tx.ventas.create({
      data: {
        empresa_id:        empresaId,
        usuario_id:        usuarioId,
        cliente_id:        cotizacion.cliente_id,
        caja_sesion_id,
        comprobante_id:    comprobante_id ?? null,
        metodo_pago_id:    Number(metodo_pago_id),
        subtotal:          cotizacion.subtotal,
        itbis:             cotizacion.itbis,
        descuento:         cotizacion.descuento,
        total:             cotizacion.total,
        efectivo_recibido: Number(efectivo_recibido ?? cotizacion.total),
        es_pago_mixto:     false,
        estado:            "completada",
      },
    })

    await tx.venta_detalles.createMany({
      data: items.map(d => ({
        venta_id:        v.id,
        producto_id:     d.producto_id,
        nombre_producto: d.nombre_producto,
        cantidad:        d.cantidad,
        precio_unitario: d.precio_unitario,
        itbis:           d.itbis,
        descuento:       d.descuento,
        subtotal:        d.subtotal,
      })),
    })

    for (const item of items) {
      if (item.producto_id) {
        await tx.productos.update({
          where: { id: item.producto_id },
          data:  { stock: { decrement: item.cantidad } },
        })
      }
    }

    await tx.cajas_sesiones.update({
      where: { id: caja_sesion_id },
      data:  { caja: { update: { saldo_actual: { increment: cotizacion.total } } } },
    })

    await tx.cotizaciones.update({
      where: { id },
      data:  { estado: "aprobada" },
    })

    return tx.ventas.findUnique({
      where: { id: v.id },
      include: {
        cliente:        { select: { nombre: true } },
        metodo_pago:    { select: { nombre: true } },
        venta_detalles: true,
      },
    })
  })
}