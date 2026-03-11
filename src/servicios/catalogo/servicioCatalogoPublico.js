import db from "../../_Db/db.js"

export async function obtenerConfigPorSlug(slug) {
  const config = await db.catalogo_config.findUnique({
    where:  { url_slug: slug },
    select: {
      id: true, empresa_id: true, nombre: true, descripcion: true,
      url_slug: true, logo: true, color_primario: true,
      color_secundario: true, whatsapp: true, horario: true,
      direccion: true, activo: true,
    },
  })
  if (!config) throw new Error("Catálogo no encontrado")
  if (!config.activo) throw new Error("Catálogo no disponible")
  return config
}

export async function obtenerProductosPorSlug(slug) {
  const config = await db.catalogo_config.findUnique({
    where: { url_slug: slug },
    select: { empresa_id: true },
  })
  if (!config) throw new Error("Catálogo no encontrado")

  const productos = await db.productos.findMany({
    where: { empresa_id: config.empresa_id, activo: true },
    select: {
      id: true, nombre: true, descripcion: true,
      codigo: true, imagen: true, precio: true, stock: true,
      catalogo_productos: {
        where: { empresa_id: config.empresa_id },
        select: { visible: true, destacado: true, orden: true },
      },
    },
    orderBy: { nombre: "asc" },
  })

  return productos
    .map(p => {
      const cat = p.catalogo_productos[0]
      return {
        id:          p.id,
        nombre:      p.nombre,
        descripcion: p.descripcion,
        codigo:      p.codigo,
        imagen:      p.imagen,
        precio:      p.precio,
        stock:       p.stock,
        visible:     cat?.visible  ?? true,
        destacado:   cat?.destacado ?? false,
      }
    })
    .filter(p => p.visible)
    .sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0))
}

export async function crearPedidoCatalogo(body) {
  const { empresa_id, nombre_cliente, telefono, email, direccion, notas, total, items } = body

  if (!empresa_id)     throw new Error("empresa_id requerido")
  if (!nombre_cliente) throw new Error("nombre_cliente requerido")
  if (!items?.length)  throw new Error("El pedido debe tener al menos un producto")

  return db.catalogo_pedidos.create({
    data: {
      empresa_id,
      nombre_cliente,
      telefono:  telefono  ?? null,
      email:     email     ?? null,
      direccion: direccion ?? null,
      notas:     notas     ?? null,
      total,
      items: {
        create: items.map(i => ({
          producto_id:     i.producto_id ?? null,
          nombre_producto: i.nombre_producto,
          cantidad:        i.cantidad,
          precio:          i.precio,
          subtotal:        i.subtotal,
        })),
      },
    },
  })
}