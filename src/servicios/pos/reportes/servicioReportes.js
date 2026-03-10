import db from "../../../_Db/db.js"

function getRango(periodo, año, mes) {
  const y = Number(año ?? new Date().getFullYear())
  const m = Number(mes ?? new Date().getMonth() + 1)

  if (periodo === "mes") {
    const inicio = new Date(y, m - 1, 1)
    const fin    = new Date(y, m, 1)
    return { inicio, fin, label: `${inicio.toLocaleString("es-DO", { month: "long" })} ${y}` }
  }
  if (periodo === "año") {
    return { inicio: new Date(y, 0, 1), fin: new Date(y + 1, 0, 1), label: `Ano ${y}` }
  }
  const q = Math.floor((m - 1) / 3)
  return { inicio: new Date(y, q * 3, 1), fin: new Date(y, q * 3 + 3, 1), label: `Q${q + 1} ${y}` }
}

export async function getReporteVentas(empresaId, periodo = "mes", año, mes) {
  const { inicio, fin, label } = getRango(periodo, año, mes)
  const baseWhere = { empresa_id: empresaId, estado: "completada", created_at: { gte: inicio, lt: fin } }

  const [resumen, ventasPorDia, ventasPorMetodo, detalles] = await Promise.all([
    db.ventas.aggregate({
      where: baseWhere,
      _sum:   { total: true, subtotal: true, itbis: true, descuento: true },
      _count: true,
    }),

    db.$queryRaw`
      SELECT DATE(created_at) AS fecha, COUNT(*) AS cantidad, SUM(total) AS total
      FROM ventas
      WHERE empresa_id = ${empresaId} AND estado = 'completada'
        AND created_at >= ${inicio} AND created_at < ${fin}
      GROUP BY DATE(created_at)
      ORDER BY fecha ASC
    `,

    db.ventas.groupBy({
      by: ["metodo_pago_id"],
      where: baseWhere,
      _sum: { total: true },
      _count: true,
    }).then(async rows => {
      const ids  = rows.map(r => r.metodo_pago_id).filter(Boolean)
      const mets = await db.metodos_pago.findMany({ where: { id: { in: ids } }, select: { id: true, nombre: true } })
      const map  = Object.fromEntries(mets.map(m => [m.id, m.nombre]))
      return rows.map(r => ({ nombre: map[r.metodo_pago_id] ?? "Otro", total: Number(r._sum.total ?? 0), cantidad: r._count }))
    }),

    db.ventas.findMany({
      where: { empresa_id: empresaId, created_at: { gte: inicio, lt: fin } },
      orderBy: { created_at: "desc" },
      select: {
        id: true, total: true, subtotal: true, itbis: true, descuento: true, estado: true, created_at: true,
        cliente:     { select: { nombre: true } },
        usuario:     { select: { nombre_completo: true } },
        metodo_pago: { select: { nombre: true } },
        comprobante: { select: { codigo: true } },
      },
    }),
  ])

  return {
    label,
    resumen: {
      total:     Number(resumen._sum.total     ?? 0),
      subtotal:  Number(resumen._sum.subtotal  ?? 0),
      itbis:     Number(resumen._sum.itbis     ?? 0),
      descuento: Number(resumen._sum.descuento ?? 0),
      cantidad:  resumen._count,
    },
    ventasPorDia: ventasPorDia.map(r => ({ fecha: r.fecha, cantidad: Number(r.cantidad), total: Number(r.total) })),
    ventasPorMetodo,
    detalles,
  }
}

export async function getReporteProductos(empresaId, periodo = "mes", año, mes) {
  const { inicio, fin, label } = getRango(periodo, año, mes)

  const [topVendidos, resumenCategorias] = await Promise.all([
    db.venta_detalles.groupBy({
      by: ["producto_id"],
      where: { venta: { empresa_id: empresaId, estado: "completada", created_at: { gte: inicio, lt: fin } } },
      _sum:   { cantidad: true, subtotal: true },
      orderBy: { _sum: { subtotal: "desc" } },
      take: 20,
    }).then(async rows => {
      const ids   = rows.map(r => r.producto_id).filter(Boolean)
      const prods = await db.productos.findMany({
        where: { id: { in: ids } },
        select: { id: true, nombre: true, precio: true, categoria: { select: { nombre: true } } },
      })
      const map = Object.fromEntries(prods.map(p => [p.id, p]))
      return rows.map(r => ({
        nombre:    map[r.producto_id]?.nombre ?? "Eliminado",
        categoria: map[r.producto_id]?.categoria?.nombre ?? "-",
        precio:    Number(map[r.producto_id]?.precio ?? 0),
        cantidad:  Number(r._sum.cantidad ?? 0),
        total:     Number(r._sum.subtotal ?? 0),
      }))
    }),

    db.venta_detalles.groupBy({
      by: ["producto_id"],
      where: { venta: { empresa_id: empresaId, estado: "completada", created_at: { gte: inicio, lt: fin } } },
      _sum: { subtotal: true },
    }).then(async rows => {
      const ids   = rows.map(r => r.producto_id).filter(Boolean)
      const prods = await db.productos.findMany({ where: { id: { in: ids } }, select: { id: true, categoria: { select: { nombre: true } } } })
      const catMap = Object.fromEntries(prods.map(p => [p.id, p.categoria?.nombre ?? "Sin categoria"]))
      const acc = {}
      for (const r of rows) {
        const cat = catMap[r.producto_id] ?? "Sin categoria"
        acc[cat] = (acc[cat] ?? 0) + Number(r._sum.subtotal ?? 0)
      }
      return Object.entries(acc).map(([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total)
    }),
  ])

  return { label, topVendidos, resumenCategorias }
}

export async function getReporteClientes(empresaId, periodo = "mes", año, mes) {
  const { inicio, fin, label } = getRango(periodo, año, mes)

  const topClientes = await db.ventas.groupBy({
    by: ["cliente_id"],
    where: { empresa_id: empresaId, estado: "completada", created_at: { gte: inicio, lt: fin }, cliente_id: { not: null } },
    _sum:   { total: true },
    _count: true,
    orderBy: { _sum: { total: "desc" } },
    take: 20,
  }).then(async rows => {
    const ids  = rows.map(r => r.cliente_id).filter(Boolean)
    const clis = await db.clientes.findMany({ where: { id: { in: ids } }, select: { id: true, nombre: true, telefono: true } })
    const map  = Object.fromEntries(clis.map(c => [c.id, c]))
    return rows.map(r => ({
      nombre:   map[r.cliente_id]?.nombre   ?? "Desconocido",
      telefono: map[r.cliente_id]?.telefono ?? "-",
      compras:  r._count,
      total:    Number(r._sum.total ?? 0),
    }))
  })

  return { label, topClientes }
}

export async function getReporteGastos(empresaId, periodo = "mes", año, mes) {
  const { inicio, fin, label } = getRango(periodo, año, mes)
  const where = { empresa_id: empresaId, created_at: { gte: inicio, lt: fin } }

  const [resumen, porTipo, detalles] = await Promise.all([
    db.gastos.aggregate({ where, _sum: { monto: true }, _count: true }),
    db.gastos.groupBy({
      by: ["tipo"],
      where,
      _sum: { monto: true },
      _count: true,
      orderBy: { _sum: { monto: "desc" } },
    }),
    db.gastos.findMany({
      where,
      orderBy: { created_at: "desc" },
      select: { id: true, concepto: true, tipo: true, monto: true, created_at: true, usuario: { select: { nombre_completo: true } } },
    }),
  ])

  return {
    label,
    resumen: { total: Number(resumen._sum.monto ?? 0), cantidad: resumen._count },
    porTipo: porTipo.map(r => ({ tipo: r.tipo ?? "Sin tipo", total: Number(r._sum.monto ?? 0), cantidad: r._count })),
    detalles,
  }
}