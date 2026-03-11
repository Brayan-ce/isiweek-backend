import db from "../../../../_Db/db.js"

export async function getDashboardCreditos(empresaId) {
  const hoy       = new Date()
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const en7dias   = new Date(hoy); en7dias.setDate(hoy.getDate() + 7)

  const [
    contratosActivos,
    carteraActiva,
    pagosDelMes,
    cuotasVencidas,
    montoPorCobrar,
    contratosRecientes,
    cuotasProximas,
    alertasMora,
    pagosUltimos6Meses,
  ] = await Promise.all([

    db.fin_contratos.count({
      where: { empresa_id: empresaId, estado: "activo" },
    }),

    db.fin_contratos.aggregate({
      where: { empresa_id: empresaId, estado: "activo" },
      _sum: { saldo_pendiente: true },
    }),

    db.fin_pagos.aggregate({
      where: {
        empresa_id: empresaId,
        fecha: { gte: inicioMes },
      },
      _sum: { monto: true },
      _count: { id: true },
    }),

    db.fin_cuotas.count({
      where: {
        empresa_id: empresaId,
        estado: "vencida",
      },
    }),

    db.fin_cuotas.aggregate({
      where: {
        empresa_id: empresaId,
        estado: { in: ["pendiente", "vencida", "parcial"] },
      },
      _sum: { monto: true },
    }),

    db.fin_contratos.findMany({
      where: { empresa_id: empresaId },
      orderBy: { created_at: "desc" },
      take: 8,
      select: {
        id: true, numero: true, estado: true,
        monto_total: true, saldo_pendiente: true,
        cuota_mensual: true, meses: true,
        fecha_inicio: true, fecha_fin: true,
        cliente: { select: { nombre: true } },
        plan:    { select: { nombre: true } },
      },
    }),

    db.fin_cuotas.findMany({
      where: {
        empresa_id: empresaId,
        estado: { in: ["pendiente", "parcial"] },
        fecha_vencimiento: { lte: en7dias, gte: hoy },
      },
      orderBy: { fecha_vencimiento: "asc" },
      take: 10,
      select: {
        id: true, numero: true, monto: true, mora: true,
        fecha_vencimiento: true, estado: true,
        contrato: {
          select: {
            numero: true,
            cliente: { select: { nombre: true, telefono: true } },
          },
        },
      },
    }),

    db.fin_cuotas.findMany({
      where: {
        empresa_id: empresaId,
        estado: "vencida",
      },
      orderBy: { fecha_vencimiento: "asc" },
      take: 10,
      select: {
        id: true, numero: true, monto: true, mora: true,
        fecha_vencimiento: true, estado: true,
        contrato: {
          select: {
            numero: true,
            cliente: { select: { nombre: true, telefono: true } },
          },
        },
      },
    }),

    (async () => {
      const meses = []
      for (let i = 5; i >= 0; i--) {
        const d     = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
        const fin   = new Date(hoy.getFullYear(), hoy.getMonth() - i + 1, 1)
        const label = d.toLocaleDateString("es-DO", { month: "short", year: "2-digit" })
        const agg   = await db.fin_pagos.aggregate({
          where: { empresa_id: empresaId, fecha: { gte: d, lt: fin } },
          _sum: { monto: true },
        })
        meses.push({ label, monto: Number(agg._sum.monto ?? 0) })
      }
      return meses
    })(),
  ])

  return {
    metricas: {
      contratos_activos:  contratosActivos,
      cartera_activa:     Number(carteraActiva._sum.saldo_pendiente ?? 0),
      pagos_mes_monto:    Number(pagosDelMes._sum.monto ?? 0),
      pagos_mes_count:    pagosDelMes._count.id,
      cuotas_vencidas:    cuotasVencidas,
      monto_por_cobrar:   Number(montoPorCobrar._sum.monto ?? 0),
    },
    contratos_recientes: contratosRecientes,
    cuotas_proximas:     cuotasProximas,
    alertas_mora:        alertasMora,
    pagos_grafica:       pagosUltimos6Meses,
  }
}