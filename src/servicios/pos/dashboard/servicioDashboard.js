import db from "../../../_Db/db.js"

function inicioHoy() {
  const d = new Date(); d.setHours(0,0,0,0); return d
}
function inicioSemana() {
  const d = new Date(); d.setHours(0,0,0,0)
  d.setDate(d.getDate() - d.getDay()); return d
}
function inicioMes() {
  const d = new Date(); d.setHours(0,0,0,0)
  d.setDate(1); return d
}

export async function getDashboardAdmin(empresaId) {
  const hoy    = inicioHoy()
  const semana = inicioSemana()
  const mes    = inicioMes()

  const baseWhere = { empresa_id: empresaId, estado: "completada" }

  const [
    ventasHoy, ventasSemana, ventasMes,
    totalVentasHoy, totalVentasSemana, totalVentasMes,
    ultimasVentas,
    cajaActiva,
    stockBajo,
    topProductos,
    ventasPorDia,
    ventasPorMetodo,
  ] = await Promise.all([
    db.ventas.count({ where: { ...baseWhere, created_at: { gte: hoy } } }),
    db.ventas.count({ where: { ...baseWhere, created_at: { gte: semana } } }),
    db.ventas.count({ where: { ...baseWhere, created_at: { gte: mes } } }),
    db.ventas.aggregate({ _sum: { total: true }, where: { ...baseWhere, created_at: { gte: hoy } } }),
    db.ventas.aggregate({ _sum: { total: true }, where: { ...baseWhere, created_at: { gte: semana } } }),
    db.ventas.aggregate({ _sum: { total: true }, where: { ...baseWhere, created_at: { gte: mes } } }),
    db.ventas.findMany({
      where: { empresa_id: empresaId, estado: "completada" },
      take: 8,
      orderBy: { created_at: "desc" },
      select: {
        id: true, total: true, created_at: true,
        cliente: { select: { nombre: true } },
        usuario: { select: { nombre_completo: true } },
        metodo_pago: { select: { nombre: true } },
      },
    }),
    db.cajas_sesiones.findFirst({
      where: { caja: { empresa_id: empresaId }, estado: "abierta" },
      include: { caja: { select: { nombre: true, saldo_actual: true } }, usuario: { select: { nombre_completo: true } } },
    }),
    db.productos.findMany({
      where: { empresa_id: empresaId, activo: true, stock: { lte: 5 } },
      take: 6,
      orderBy: { stock: "asc" },
      select: { id: true, nombre: true, stock: true, categoria: { select: { nombre: true } } },
    }),
    db.venta_detalles.groupBy({
      by: ["producto_id"],
      where: { venta: { empresa_id: empresaId, estado: "completada", created_at: { gte: mes } } },
      _sum: { cantidad: true, subtotal: true },
      orderBy: { _sum: { cantidad: "desc" } },
      take: 5,
    }).then(async rows => {
      const ids = rows.map(r => r.producto_id).filter(Boolean)
      const prods = await db.productos.findMany({ where: { id: { in: ids } }, select: { id: true, nombre: true } })
      const map = Object.fromEntries(prods.map(p => [p.id, p.nombre]))
      return rows.map(r => ({
        nombre: map[r.producto_id] ?? "Producto eliminado",
        cantidad: r._sum.cantidad ?? 0,
        total: Number(r._sum.subtotal ?? 0),
      }))
    }),
    db.$queryRaw`
      SELECT DATE(created_at) as fecha, COUNT(*) as cantidad, SUM(total) as total
      FROM ventas
      WHERE empresa_id = ${empresaId} AND estado = 'completada'
        AND created_at >= ${mes}
      GROUP BY DATE(created_at)
      ORDER BY fecha ASC
    `,
    db.ventas.groupBy({
      by: ["metodo_pago_id"],
      where: { ...baseWhere, created_at: { gte: mes } },
      _sum: { total: true },
      _count: true,
    }).then(async rows => {
      const ids = rows.map(r => r.metodo_pago_id).filter(Boolean)
      const mets = await db.metodos_pago.findMany({ where: { id: { in: ids } }, select: { id: true, nombre: true } })
      const map = Object.fromEntries(mets.map(m => [m.id, m.nombre]))
      return rows.map(r => ({
        nombre: map[r.metodo_pago_id] ?? "Otro",
        total: Number(r._sum.total ?? 0),
        cantidad: r._count,
      }))
    }),
  ])

  return {
    stats: {
      ventasHoy, ventasSemana, ventasMes,
      totalHoy:    Number(totalVentasHoy._sum.total    ?? 0),
      totalSemana: Number(totalVentasSemana._sum.total ?? 0),
      totalMes:    Number(totalVentasMes._sum.total    ?? 0),
    },
    ultimasVentas,
    cajaActiva,
    stockBajo,
    topProductos,
    ventasPorDia: ventasPorDia.map(r => ({
      fecha: r.fecha,
      cantidad: Number(r.cantidad),
      total: Number(r.total),
    })),
    ventasPorMetodo,
  }
}

export async function getDashboardVendedor(usuarioId, empresaId) {
  const hoy = inicioHoy()

  const [
    ventasHoy, totalHoy,
    ultimasVentas,
    cajaActiva,
    metaConfig,
  ] = await Promise.all([
    db.ventas.count({ where: { usuario_id: usuarioId, empresa_id: empresaId, estado: "completada", created_at: { gte: hoy } } }),
    db.ventas.aggregate({ _sum: { total: true }, where: { usuario_id: usuarioId, empresa_id: empresaId, estado: "completada", created_at: { gte: hoy } } }),
    db.ventas.findMany({
      where: { usuario_id: usuarioId, empresa_id: empresaId, estado: "completada" },
      take: 6,
      orderBy: { created_at: "desc" },
      select: {
        id: true, total: true, created_at: true,
        cliente: { select: { nombre: true } },
        metodo_pago: { select: { nombre: true } },
      },
    }),
    db.cajas_sesiones.findFirst({
      where: { usuario_id: usuarioId, estado: "abierta" },
      include: { caja: { select: { nombre: true, saldo_actual: true } } },
    }),
    db.configuracion.findFirst({
      where: { empresa_id: empresaId, clave: "meta_ventas_diaria" },
    }),
  ])

  const meta = metaConfig ? Number(metaConfig.valor) : 0

  return {
    ventasHoy,
    totalHoy: Number(totalHoy._sum.total ?? 0),
    meta,
    ultimasVentas,
    cajaActiva,
  }
}