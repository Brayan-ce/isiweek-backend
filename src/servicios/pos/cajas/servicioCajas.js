import db from "../../../_Db/db.js"

function inicioHoy() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export async function getDatosCaja(usuarioId, empresaId) {
  const hoy = inicioHoy()

  const sesionHoy = await db.cajas_sesiones.findFirst({
    where: {
      usuario_id: usuarioId,
      abierta_at: { gte: hoy },
    },
    orderBy: { abierta_at: "desc" },
    include: {
      caja: true,
      usuario: { select: { nombre_completo: true } },
    },
  })

  if (!sesionHoy) return { sesion: null, resumen: null, ventas: [], gastos: [], numeroCaja: null }

  const numeroCaja = await db.cajas_sesiones.count({
    where: { usuario_id: usuarioId }
  }).then(async () => {
    const caja = await db.cajas.findUnique({ where: { id: sesionHoy.caja_id }, select: { numero_usuario: true } })
    return caja?.numero_usuario ?? null
  })

  const [ventasAgg, ventasPorMetodo, ventasRecientes, gastos] = await Promise.all([
    db.ventas.aggregate({
      where: { caja_sesion_id: sesionHoy.id, estado: "completada" },
      _sum: { total: true },
      _count: true,
    }),

    db.ventas.groupBy({
      by: ["metodo_pago_id"],
      where: { caja_sesion_id: sesionHoy.id, estado: "completada" },
      _sum: { total: true },
      _count: true,
    }).then(async rows => {
      const ids  = rows.map(r => r.metodo_pago_id).filter(Boolean)
      const mets = await db.metodos_pago.findMany({ where: { id: { in: ids } }, select: { id: true, nombre: true } })
      const map  = Object.fromEntries(mets.map(m => [m.id, m.nombre]))
      return rows.map(r => ({
        nombre:   map[r.metodo_pago_id] ?? "Otro",
        total:    Number(r._sum.total ?? 0),
        cantidad: r._count,
      }))
    }),

    db.ventas.findMany({
      where: { caja_sesion_id: sesionHoy.id },
      take: 20,
      orderBy: { created_at: "desc" },
      select: {
        id: true, total: true, estado: true, created_at: true,
        cliente:     { select: { nombre: true } },
        metodo_pago: { select: { nombre: true } },
      },
    }),

    db.gastos.findMany({
      where: { empresa_id: empresaId, usuario_id: usuarioId, created_at: { gte: hoy } },
      orderBy: { created_at: "desc" },
      select: { id: true, concepto: true, monto: true, tipo: true, created_at: true },
    }),
  ])

  const totalVentas  = Number(ventasAgg._sum.total ?? 0)
  const totalGastos  = gastos.reduce((a, g) => a + Number(g.monto), 0)
  const totalEnCaja  = Number(sesionHoy.saldo_apertura) + totalVentas - totalGastos

  return {
    sesion: sesionHoy,
    numeroCaja,
    resumen: {
      montoInicial:    Number(sesionHoy.saldo_apertura),
      totalVentas,
      totalGastos,
      totalEnCaja,
      cantVentas:      ventasAgg._count,
      ventasPorMetodo,
    },
    ventas:  ventasRecientes,
    gastos,
  }
}

export async function abrirCaja(usuarioId, empresaId, montoInicial) {
  const hoy = inicioHoy()

  const yaExiste = await db.cajas_sesiones.findFirst({
    where: { usuario_id: usuarioId, abierta_at: { gte: hoy }, estado: "abierta" },
  })
  if (yaExiste) throw new Error("Ya tienes una caja abierta")

  const cajaExistente = await db.cajas.findFirst({
    where: { empresa_id: empresaId, nombre: `Caja-Usuario-${usuarioId}` },
  })

  let caja = cajaExistente

  if (!caja) {
    const totalCajasUsuario = await db.cajas.count({
      where: { empresa_id: empresaId, nombre: { startsWith: `Caja-Usuario-${usuarioId}` } },
    })
    const numeroCaja = totalCajasUsuario + 1

    caja = await db.cajas.create({
      data: {
        empresa_id:    empresaId,
        nombre:        `Caja-Usuario-${usuarioId}`,
        numero_usuario: numeroCaja,
        saldo_actual:  0,
        activa:        true,
      },
    })
  }

  const sesion = await db.cajas_sesiones.create({
    data: {
      caja_id:        caja.id,
      usuario_id:     usuarioId,
      saldo_apertura: Number(montoInicial ?? 0),
      estado:         "abierta",
    },
    include: { caja: true },
  })

  return { ...sesion, numeroCaja: caja.numero_usuario }
}

export async function cerrarCaja(sesionId, usuarioId, montoFinalManual = null, notas = "") {
  const sesion = await db.cajas_sesiones.findFirst({
    where: { id: sesionId, usuario_id: usuarioId },
    include: { caja: true },
  })
  if (!sesion) throw new Error("Sesión no encontrada")
  if (sesion.estado === "cerrada") throw new Error("La caja ya está cerrada")

  const hoy = inicioHoy()

  const [ventasAgg, gastos] = await Promise.all([
    db.ventas.aggregate({
      where: { caja_sesion_id: sesionId, estado: "completada" },
      _sum: { total: true },
    }),
    db.gastos.findMany({
      where: { usuario_id: usuarioId, created_at: { gte: hoy } },
      select: { monto: true },
    }),
  ])

  const totalVentas    = Number(ventasAgg._sum.total ?? 0)
  const totalGastos    = gastos.reduce((a, g) => a + Number(g.monto), 0)
  const saldoCalculado = Number(sesion.saldo_apertura) + totalVentas - totalGastos
  const saldoCierre    = montoFinalManual !== null ? Number(montoFinalManual) : saldoCalculado
  const diferencia     = saldoCierre - saldoCalculado

  return db.$transaction(async tx => {
    await tx.cajas_sesiones.update({
      where: { id: sesionId },
      data: {
        estado:          "cerrada",
        saldo_cierre:    saldoCierre,
        saldo_calculado: saldoCalculado,
        diferencia_cierre: diferencia,
        notas_cierre:    notas?.trim() || null,
        cerrada_at:      new Date(),
      },
    })
    await tx.cajas.update({
      where: { id: sesion.caja_id },
      data:  { saldo_actual: saldoCierre },
    })
    return { ok: true, saldo_cierre: saldoCierre, saldo_calculado: saldoCalculado, diferencia }
  })
}

export async function registrarGasto(usuarioId, empresaId, concepto, monto, tipo) {
  if (!concepto?.trim()) throw new Error("El concepto es obligatorio")
  if (!monto || Number(monto) <= 0) throw new Error("El monto debe ser mayor a 0")

  const hoy = inicioHoy()
  const sesion = await db.cajas_sesiones.findFirst({
    where: { usuario_id: usuarioId, abierta_at: { gte: hoy }, estado: "abierta" },
  })
  if (!sesion) throw new Error("No tienes una caja abierta hoy")

  return db.gastos.create({
    data: {
      empresa_id: empresaId,
      usuario_id: usuarioId,
      concepto:   concepto.trim(),
      monto:      Number(monto),
      tipo:       tipo?.trim() || null,
    },
    select: { id: true, concepto: true, monto: true, tipo: true, created_at: true },
  })
}

export async function getHistorialCajas(usuarioId, empresaId, pagina = 1, limite = 10) {
  const skip = (pagina - 1) * limite

  const [sesiones, total] = await Promise.all([
    db.cajas_sesiones.findMany({
      where: { usuario_id: usuarioId, caja: { empresa_id: empresaId } },
      skip,
      take: limite,
      orderBy: { abierta_at: "desc" },
      include: {
        caja: { select: { nombre: true, numero_usuario: true } },
        _count: { select: { ventas: true } },
      },
    }),
    db.cajas_sesiones.count({
      where: { usuario_id: usuarioId, caja: { empresa_id: empresaId } },
    }),
  ])

  return { sesiones, total, paginas: Math.ceil(total / limite) }
}