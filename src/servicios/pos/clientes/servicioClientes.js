import db from "../../../_Db/db.js"

export async function getClientes(empresaId, filtros = {}) {
  const { busqueda, pagina = 1, limite = 15 } = filtros
  const skip = (Number(pagina) - 1) * Number(limite)

  const where = {
    empresa_id: empresaId,
    ...(busqueda?.trim()
      ? {
          OR: [
            { nombre:     { contains: busqueda } },
            { cedula_rnc: { contains: busqueda } },
            { telefono:   { contains: busqueda } },
            { email:      { contains: busqueda } },
            { direccion:  { contains: busqueda } },
          ],
        }
      : {}),
  }

  const [clientes, total] = await Promise.all([
    db.clientes.findMany({
      where,
      skip,
      take: Number(limite),
      orderBy: { nombre: "asc" },
      include: {
        _count: { select: { ventas: true, cotizaciones: true, pedidos: true } },
      },
    }),
    db.clientes.count({ where }),
  ])

  return {
    clientes: clientes.map(c => ({
      ...c,
      total_ventas:       c._count.ventas,
      total_cotizaciones: c._count.cotizaciones,
      total_pedidos:      c._count.pedidos,
    })),
    total,
    pagina: Number(pagina),
    paginas: Math.ceil(total / Number(limite)),
  }
}

export async function crearCliente(empresaId, body) {
  const { nombre, cedula_rnc, telefono, email, direccion } = body
  if (!nombre?.trim()) throw new Error("El nombre es obligatorio")

  return db.clientes.create({
    data: {
      empresa_id:  empresaId,
      nombre:      nombre.trim(),
      cedula_rnc:  cedula_rnc?.trim()  || null,
      telefono:    telefono?.trim()    || null,
      email:       email?.trim()       || null,
      direccion:   direccion?.trim()   || null,
    },
  })
}

export async function editarCliente(empresaId, clienteId, body) {
  const cliente = await db.clientes.findFirst({
    where: { id: Number(clienteId), empresa_id: empresaId },
  })
  if (!cliente) throw new Error("Cliente no encontrado")

  const { nombre, cedula_rnc, telefono, email, direccion } = body
  if (!nombre?.trim()) throw new Error("El nombre es obligatorio")

  return db.clientes.update({
    where: { id: Number(clienteId) },
    data: {
      nombre:     nombre.trim(),
      cedula_rnc: cedula_rnc?.trim()  || null,
      telefono:   telefono?.trim()    || null,
      email:      email?.trim()       || null,
      direccion:  direccion?.trim()   || null,
    },
  })
}

export async function eliminarCliente(empresaId, clienteId) {
  const cliente = await db.clientes.findFirst({
    where: { id: Number(clienteId), empresa_id: empresaId },
    include: {
      _count: { select: { ventas: true, cotizaciones: true, pedidos: true } },
    },
  })
  if (!cliente) throw new Error("Cliente no encontrado")

  const totalRefs = cliente._count.ventas + cliente._count.cotizaciones + cliente._count.pedidos
  if (totalRefs > 0)
    throw new Error("No se puede eliminar un cliente con ventas, cotizaciones o pedidos registrados")

  return db.clientes.delete({ where: { id: Number(clienteId) } })
}