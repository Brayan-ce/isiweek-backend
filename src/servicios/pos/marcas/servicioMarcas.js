import db from "../../../_Db/db.js"

export async function getMarcas(empresaId, busqueda = "", pagina = 1, limite = 20) {
  const skip  = (pagina - 1) * limite
  const where = {
    empresa_id: Number(empresaId),
    ...(busqueda ? { nombre: { contains: busqueda } } : {}),
  }
  const [marcas, total] = await Promise.all([
    db.marcas.findMany({
      where,
      skip,
      take: limite,
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        _count: { select: { productos: true } },
      },
    }),
    db.marcas.count({ where }),
  ])
  return { marcas, total, paginas: Math.ceil(total / limite) }
}

export async function crearMarca(empresaId, nombre) {
  if (!nombre?.trim()) throw new Error("El nombre es obligatorio")
  const existe = await db.marcas.findFirst({
    where: { empresa_id: Number(empresaId), nombre: { equals: nombre.trim() } },
    select: { id: true },
  })
  if (existe) throw new Error("Ya existe una marca con ese nombre")
  return db.marcas.create({
    data: { empresa_id: Number(empresaId), nombre: nombre.trim() },
    select: { id: true, nombre: true, _count: { select: { productos: true } } },
  })
}

export async function editarMarca(id, nombre) {
  if (!nombre?.trim()) throw new Error("El nombre es obligatorio")
  return db.marcas.update({
    where: { id: Number(id) },
    data: { nombre: nombre.trim() },
    select: { id: true, nombre: true, _count: { select: { productos: true } } },
  })
}

export async function eliminarMarca(id) {
  const marca = await db.marcas.findUnique({
    where: { id: Number(id) },
    select: { _count: { select: { productos: true } } },
  })
  if (!marca) throw new Error("Marca no encontrada")
  if (marca._count.productos > 0)
    throw new Error(`No se puede eliminar: tiene ${marca._count.productos} producto(s) asignado(s)`)
  await db.marcas.delete({ where: { id: Number(id) } })
  return { ok: true }
}