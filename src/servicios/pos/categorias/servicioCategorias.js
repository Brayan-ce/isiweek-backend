import db from "../../../_Db/db.js"

export async function getCategorias(empresaId, busqueda = "", pagina = 1, limite = 20) {
  const skip  = (pagina - 1) * limite
  const where = {
    empresa_id: Number(empresaId),
    ...(busqueda ? { nombre: { contains: busqueda } } : {}),
  }
  const [categorias, total] = await Promise.all([
    db.categorias.findMany({
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
    db.categorias.count({ where }),
  ])
  return { categorias, total, paginas: Math.ceil(total / limite) }
}

export async function crearCategoria(empresaId, nombre) {
  if (!nombre?.trim()) throw new Error("El nombre es obligatorio")
  const existe = await db.categorias.findFirst({
    where: { empresa_id: Number(empresaId), nombre: { equals: nombre.trim() } },
    select: { id: true },
  })
  if (existe) throw new Error("Ya existe una categoría con ese nombre")
  return db.categorias.create({
    data: { empresa_id: Number(empresaId), nombre: nombre.trim() },
    select: { id: true, nombre: true, _count: { select: { productos: true } } },
  })
}

export async function editarCategoria(id, nombre) {
  if (!nombre?.trim()) throw new Error("El nombre es obligatorio")
  return db.categorias.update({
    where: { id: Number(id) },
    data: { nombre: nombre.trim() },
    select: { id: true, nombre: true, _count: { select: { productos: true } } },
  })
}

export async function eliminarCategoria(id) {
  const cat = await db.categorias.findUnique({
    where: { id: Number(id) },
    select: { _count: { select: { productos: true } } },
  })
  if (!cat) throw new Error("Categoría no encontrada")
  if (cat._count.productos > 0)
    throw new Error(`No se puede eliminar: tiene ${cat._count.productos} producto(s) asignado(s)`)
  await db.categorias.delete({ where: { id: Number(id) } })
  return { ok: true }
}