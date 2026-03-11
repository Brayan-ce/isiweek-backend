import db from "../../../../_Db/db.js"

const ESTADOS_VALIDOS = ["pendiente", "confirmado", "enviado", "entregado", "cancelado"]

export async function obtenerPedidos(empresaId, filtros = {}) {
  const { busqueda, estado, pagina = 1, limite = 20 } = filtros
  const skip = (Number(pagina) - 1) * Number(limite)

  const where = { empresa_id: empresaId }

  if (estado && ESTADOS_VALIDOS.includes(estado)) {
    where.estado = estado
  }

  if (busqueda) {
    where.OR = [
      { nombre_cliente: { contains: busqueda } },
      { email:          { contains: busqueda } },
      { telefono:       { contains: busqueda } },
    ]
  }

  const [pedidos, total] = await Promise.all([
    db.catalogo_pedidos.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: Number(limite),
      select: {
        id: true, nombre_cliente: true, telefono: true,
        email: true, total: true, estado: true, created_at: true,
      },
    }),
    db.catalogo_pedidos.count({ where }),
  ])

  return {
    pedidos,
    total,
    paginas: Math.ceil(total / Number(limite)),
    pagina:  Number(pagina),
  }
}

export async function obtenerPedido(empresaId, pedidoId) {
  const pedido = await db.catalogo_pedidos.findFirst({
    where: { id: pedidoId, empresa_id: empresaId },
    include: {
      items: {
        select: {
          id: true, nombre_producto: true,
          cantidad: true, precio: true, subtotal: true,
        },
      },
    },
  })
  if (!pedido) throw new Error("Pedido no encontrado")
  return pedido
}

export async function cambiarEstadoPedido(empresaId, pedidoId, estado) {
  if (!ESTADOS_VALIDOS.includes(estado)) throw new Error("Estado no válido")

  const pedido = await db.catalogo_pedidos.findFirst({
    where: { id: pedidoId, empresa_id: empresaId },
  })
  if (!pedido) throw new Error("Pedido no encontrado")

  return db.catalogo_pedidos.update({
    where: { id: pedidoId },
    data:  { estado },
  })
}

export async function obtenerResumenPedidos(empresaId) {
  const ahora   = new Date()
  const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  const mesInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

  const [hoy, pendientes, entregadosMes, totalMesData] = await Promise.all([
    db.catalogo_pedidos.count({
      where: { empresa_id: empresaId, created_at: { gte: hoyInicio } },
    }),
    db.catalogo_pedidos.count({
      where: { empresa_id: empresaId, estado: "pendiente" },
    }),
    db.catalogo_pedidos.count({
      where: { empresa_id: empresaId, estado: "entregado", created_at: { gte: mesInicio } },
    }),
    db.catalogo_pedidos.aggregate({
      where: { empresa_id: empresaId, created_at: { gte: mesInicio } },
      _sum: { total: true },
    }),
  ])

  return {
    hoy,
    pendientes,
    entregados_mes: entregadosMes,
    total_mes:      totalMesData._sum.total ?? 0,
  }
}