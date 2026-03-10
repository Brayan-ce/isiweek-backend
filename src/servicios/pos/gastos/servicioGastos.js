import db from "../../../_Db/db.js"

export async function getGastos(empresaId, filtros = {}) {
  const { busqueda, tipo, pagina = 1, limite = 20 } = filtros
  const skip = (Number(pagina) - 1) * Number(limite)

  const where = {
    empresa_id: empresaId,
    ...(busqueda?.trim()
      ? {
          OR: [
            { concepto: { contains: busqueda } },
            { tipo:     { contains: busqueda } },
          ],
        }
      : {}),
    ...(tipo?.trim() ? { tipo: { contains: tipo } } : {}),
  }

  const [gastos, total] = await Promise.all([
    db.gastos.findMany({
      where,
      skip,
      take: Number(limite),
      orderBy: { created_at: "desc" },
      include: {
        usuario: { select: { id: true, nombre_completo: true } },
      },
    }),
    db.gastos.count({ where }),
  ])

  return {
    gastos,
    total,
    pagina:  Number(pagina),
    paginas: Math.ceil(total / Number(limite)),
  }
}

export async function getTiposGasto(empresaId) {
  const rows = await db.gastos.findMany({
    where: { empresa_id: empresaId, tipo: { not: null } },
    select: { tipo: true },
    distinct: ["tipo"],
    orderBy: { tipo: "asc" },
  })
  return rows.map(r => r.tipo).filter(Boolean)
}

export async function crearGasto(usuarioId, empresaId, body) {
  const { concepto, monto, tipo } = body
  if (!concepto?.trim()) throw new Error("El concepto es obligatorio")
  const m = Number(monto)
  if (!m || m <= 0) throw new Error("El monto debe ser mayor a 0")

  const sesionAbierta = await db.cajas_sesiones.findFirst({
    where: {
      usuario_id: usuarioId,
      caja: { empresa_id: empresaId },
      estado: "abierta",
    },
  })
  if (!sesionAbierta) throw new Error("No tienes una caja abierta para registrar gastos")

  return db.gastos.create({
    data: {
      empresa_id: empresaId,
      usuario_id: usuarioId,
      concepto:   concepto.trim(),
      monto:      m,
      tipo:       tipo?.trim() || null,
    },
    include: {
      usuario: { select: { id: true, nombre_completo: true } },
    },
  })
}

export async function editarGasto(empresaId, gastoId, body) {
  const gasto = await db.gastos.findFirst({
    where: { id: Number(gastoId), empresa_id: empresaId },
  })
  if (!gasto) throw new Error("Gasto no encontrado")

  const { concepto, monto, tipo } = body
  if (!concepto?.trim()) throw new Error("El concepto es obligatorio")
  const m = Number(monto)
  if (!m || m <= 0) throw new Error("El monto debe ser mayor a 0")

  return db.gastos.update({
    where: { id: Number(gastoId) },
    data: {
      concepto: concepto.trim(),
      monto:    m,
      tipo:     tipo?.trim() || null,
    },
    include: {
      usuario: { select: { id: true, nombre_completo: true } },
    },
  })
}

export async function eliminarGasto(empresaId, gastoId) {
  const gasto = await db.gastos.findFirst({
    where: { id: Number(gastoId), empresa_id: empresaId },
  })
  if (!gasto) throw new Error("Gasto no encontrado")
  return db.gastos.delete({ where: { id: Number(gastoId) } })
}

export async function getResumenGastos(empresaId) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const [totalHoy, totalMes, porTipo] = await Promise.all([
    db.gastos.aggregate({
      where: { empresa_id: empresaId, created_at: { gte: hoy } },
      _sum: { monto: true },
      _count: true,
    }),
    db.gastos.aggregate({
      where: {
        empresa_id: empresaId,
        created_at: { gte: new Date(hoy.getFullYear(), hoy.getMonth(), 1) },
      },
      _sum: { monto: true },
      _count: true,
    }),
    db.gastos.groupBy({
      by: ["tipo"],
      where: {
        empresa_id: empresaId,
        created_at: { gte: new Date(hoy.getFullYear(), hoy.getMonth(), 1) },
      },
      _sum: { monto: true },
      _count: true,
      orderBy: { _sum: { monto: "desc" } },
    }),
  ])

  return {
    hoy: {
      total: totalHoy._sum.monto ?? 0,
      cantidad: totalHoy._count,
    },
    mes: {
      total: totalMes._sum.monto ?? 0,
      cantidad: totalMes._count,
    },
    porTipo: porTipo.map(t => ({
      tipo:     t.tipo ?? "Sin tipo",
      total:    t._sum.monto ?? 0,
      cantidad: t._count,
    })),
  }
}