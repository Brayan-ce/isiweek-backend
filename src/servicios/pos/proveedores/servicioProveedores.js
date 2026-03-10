import db from "../../../_Db/db.js"

export async function getProveedores(empresaId, filtros = {}) {
  const { busqueda, pagina = 1, limite = 15 } = filtros
  const skip = (Number(pagina) - 1) * Number(limite)

  const where = {
    empresa_id: empresaId,
    ...(busqueda?.trim()
      ? {
          OR: [
            { nombre:    { contains: busqueda } },
            { rnc:       { contains: busqueda } },
            { telefono:  { contains: busqueda } },
            { email:     { contains: busqueda } },
            { direccion: { contains: busqueda } },
          ],
        }
      : {}),
  }

  const [proveedores, total] = await Promise.all([
    db.proveedores.findMany({
      where,
      skip,
      take: Number(limite),
      orderBy: { nombre: "asc" },
      include: { _count: { select: { compras: true } } },
    }),
    db.proveedores.count({ where }),
  ])

  return {
    proveedores: proveedores.map(p => ({ ...p, total_compras: p._count.compras })),
    total,
    pagina: Number(pagina),
    paginas: Math.ceil(total / Number(limite)),
  }
}

export async function crearProveedor(empresaId, body) {
  const { nombre, rnc, telefono, email, direccion } = body
  if (!nombre?.trim()) throw new Error("El nombre es obligatorio")

  return db.proveedores.create({
    data: {
      empresa_id: empresaId,
      nombre:    nombre.trim(),
      rnc:       rnc?.trim()       || null,
      telefono:  telefono?.trim()  || null,
      email:     email?.trim()     || null,
      direccion: direccion?.trim() || null,
    },
  })
}

export async function editarProveedor(empresaId, proveedorId, body) {
  const proveedor = await db.proveedores.findFirst({
    where: { id: Number(proveedorId), empresa_id: empresaId },
  })
  if (!proveedor) throw new Error("Proveedor no encontrado")

  const { nombre, rnc, telefono, email, direccion } = body
  if (!nombre?.trim()) throw new Error("El nombre es obligatorio")

  return db.proveedores.update({
    where: { id: Number(proveedorId) },
    data: {
      nombre:    nombre.trim(),
      rnc:       rnc?.trim()       || null,
      telefono:  telefono?.trim()  || null,
      email:     email?.trim()     || null,
      direccion: direccion?.trim() || null,
    },
  })
}

export async function eliminarProveedor(empresaId, proveedorId) {
  const proveedor = await db.proveedores.findFirst({
    where: { id: Number(proveedorId), empresa_id: empresaId },
    include: { _count: { select: { compras: true } } },
  })
  if (!proveedor) throw new Error("Proveedor no encontrado")
  if (proveedor._count.compras > 0)
    throw new Error("No se puede eliminar un proveedor con compras registradas")

  return db.proveedores.delete({ where: { id: Number(proveedorId) } })
}