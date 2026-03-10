import db from "../../../_Db/db.js"

export async function getInventario(empresaId, filtros = {}) {
  const { busqueda, categoria_id, marca_id, stock_filtro, pagina = 1, limite = 20 } = filtros
  const skip = (Number(pagina) - 1) * Number(limite)

  const where = {
    empresa_id: empresaId,
    activo: true,
    ...(busqueda?.trim()
      ? {
          OR: [
            { nombre:  { contains: busqueda } },
            { codigo:  { contains: busqueda } },
            { barcode: { contains: busqueda } },
          ],
        }
      : {}),
    ...(categoria_id ? { categoria_id: Number(categoria_id) } : {}),
    ...(marca_id     ? { marca_id:     Number(marca_id)     } : {}),
    ...(stock_filtro === "sin_stock"  ? { stock: { lte: 0 } }          : {}),
    ...(stock_filtro === "bajo_stock" ? { stock: { gt: 0, lte: 5 } }   : {}),
    ...(stock_filtro === "con_stock"  ? { stock: { gt: 5 } }           : {}),
  }

  const [productos, total] = await Promise.all([
    db.productos.findMany({
      where,
      skip,
      take: Number(limite),
      orderBy: { nombre: "asc" },
      include: {
        categoria: { select: { id: true, nombre: true } },
        marca:     { select: { id: true, nombre: true } },
      },
    }),
    db.productos.count({ where }),
  ])

  return {
    productos,
    total,
    pagina:  Number(pagina),
    paginas: Math.ceil(total / Number(limite)),
  }
}

export async function getCategoriasMarcas(empresaId) {
  const [categorias, marcas] = await Promise.all([
    db.categorias.findMany({ where: { empresa_id: empresaId }, orderBy: { nombre: "asc" } }),
    db.marcas.findMany({     where: { empresa_id: empresaId }, orderBy: { nombre: "asc" } }),
  ])
  return { categorias, marcas }
}

export async function ajustarStock(empresaId, productoId, nuevoStock) {
  const producto = await db.productos.findFirst({
    where: { id: Number(productoId), empresa_id: empresaId },
  })
  if (!producto) throw new Error("Producto no encontrado")

  const stock = Number(nuevoStock)
  if (isNaN(stock) || stock < 0) throw new Error("El stock debe ser un número mayor o igual a 0")

  return db.productos.update({
    where: { id: Number(productoId) },
    data:  { stock },
  })
}