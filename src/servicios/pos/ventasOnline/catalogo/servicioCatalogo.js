import db from "../../../../_Db/db.js"
import path from "path"
import fs from "fs/promises"
import { fileURLToPath } from "url"
import { createCanvas } from "canvas"
import JsBarcode from "jsbarcode"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = path.join(__dirname, "../../../../../public")

export async function obtenerConfigCatalogo(empresaId) {
  const config = await db.catalogo_config.findUnique({
    where: { empresa_id: empresaId },
  })
  return config
}

export async function guardarConfigCatalogo(empresaId, body) {
  const {
    nombre, descripcion, url_slug, whatsapp,
    horario, direccion, color_primario,
    color_secundario, activo, logo,
  } = body

  const existe = await db.catalogo_config.findUnique({ where: { empresa_id: empresaId } })

  if (existe) {
    return db.catalogo_config.update({
      where: { empresa_id: empresaId },
      data: {
        nombre, descripcion, url_slug, whatsapp,
        horario, direccion, color_primario,
        color_secundario, activo,
        ...(logo !== undefined ? { logo } : {}),
      },
    })
  }

  return db.catalogo_config.create({
    data: {
      empresa_id: empresaId,
      nombre, descripcion, url_slug, whatsapp,
      horario, direccion, color_primario,
      color_secundario, activo: activo ?? true,
      logo: logo ?? null,
    },
  })
}

export async function obtenerProductosCatalogo(empresaId) {
  const productos = await db.productos.findMany({
    where: { empresa_id: empresaId, activo: true },
    select: {
      id: true, nombre: true, codigo: true,
      precio: true, stock: true, imagen: true,
      catalogo_productos: {
        where: { empresa_id: empresaId },
        select: { visible: true, destacado: true, orden: true },
      },
    },
    orderBy: { nombre: "asc" },
  })

  return productos.map(p => {
    const cat = p.catalogo_productos[0]
    return {
      id:        p.id,
      nombre:    p.nombre,
      codigo:    p.codigo,
      precio:    p.precio,
      stock:     p.stock,
      imagen:    p.imagen,
      visible:   cat?.visible  ?? true,
      destacado: cat?.destacado ?? false,
      orden:     cat?.orden     ?? 0,
    }
  })
}

export async function toggleProductoCatalogo(empresaId, productoId, body) {
  const existe = await db.catalogo_productos.findUnique({
    where: { empresa_id_producto_id: { empresa_id: empresaId, producto_id: productoId } },
  })

  if (existe) {
    return db.catalogo_productos.update({
      where: { empresa_id_producto_id: { empresa_id: empresaId, producto_id: productoId } },
      data: body,
    })
  }

  return db.catalogo_productos.create({
    data: {
      empresa_id:  empresaId,
      producto_id: productoId,
      visible:     body.visible  ?? true,
      destacado:   body.destacado ?? false,
    },
  })
}

export async function subirLogoCatalogo(empresaId, req) {
  const data = await req.file()
  if (!data) throw new Error("No se recibió ningún archivo")

  const ext      = path.extname(data.filename) || ".jpg"
  const fileName = `logo_cat_${empresaId}_${Date.now()}${ext}`
  const destDir  = path.join(PUBLIC_DIR, "uploads", "catalogos")
  const destPath = path.join(destDir, fileName)

  await fs.mkdir(destDir, { recursive: true })

  const chunks = []
  for await (const chunk of data.file) chunks.push(chunk)
  await fs.writeFile(destPath, Buffer.concat(chunks))

  const url = `/uploads/catalogos/${fileName}`
  return { url }
}

export async function generarQRCatalogo(url) {
  const QRCode = (await import("qrcode")).default
  const qr = await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" },
  })
  return { qr }
}