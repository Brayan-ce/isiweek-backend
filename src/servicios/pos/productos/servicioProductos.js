import db from "../../../_Db/db.js"
import fs from "fs/promises"
import path from "path"
import { createCanvas } from "canvas"
import JsBarcode from "jsbarcode"

const SELECT_PROD = {
  id: true, nombre: true, descripcion: true, codigo: true, imagen: true,
  precio: true, precio_costo: true, stock: true,
  itbis_pct: true, itbis_habilitado: true, activo: true,
  categoria_id: true, marca_id: true,
  categoria: { select: { nombre: true } },
  marca:     { select: { nombre: true } },
}

export async function getProductos(empresaId, busqueda = "", pagina = 1, limite = 20) {
  const skip  = (pagina - 1) * limite
  const where = {
    empresa_id: empresaId,
    ...(busqueda ? {
      OR: [
        { nombre:      { contains: busqueda } },
        { codigo:      { contains: busqueda } },
        { descripcion: { contains: busqueda } },
      ],
    } : {}),
  }

  const [productos, total] = await Promise.all([
    db.productos.findMany({ where, skip, take: limite, orderBy: { nombre: "asc" }, select: SELECT_PROD }),
    db.productos.count({ where }),
  ])

  return { productos, total, paginas: Math.ceil(total / limite) }
}

export async function getDatosFormulario(empresaId) {
  const [categorias, marcas] = await Promise.all([
    db.categorias.findMany({ where: { empresa_id: empresaId }, select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
    db.marcas.findMany({     where: { empresa_id: empresaId }, select: { id: true, nombre: true }, orderBy: { nombre: "asc" } }),
  ])
  return { categorias, marcas }
}

export async function crearProducto(empresaId, data) {
  if (!data.nombre?.trim()) throw new Error("El nombre es obligatorio")
  if (data.precio === undefined || data.precio === null) throw new Error("El precio es obligatorio")

  return db.productos.create({
    data: {
      empresa_id:       empresaId,
      nombre:           data.nombre.trim(),
      descripcion:      data.descripcion   ?? null,
      codigo:           data.codigo?.trim() || null,
      precio:           Number(data.precio),
      precio_costo:     Number(data.precio_costo ?? 0),
      stock:            Number(data.stock ?? 0),
      itbis_pct:        Number(data.itbis_pct ?? 18),
      itbis_habilitado: data.itbis_habilitado ?? true,
      categoria_id:     data.categoria_id ?? null,
      marca_id:         data.marca_id     ?? null,
      activo:           data.activo ?? true,
    },
    select: SELECT_PROD,
  })
}

export async function editarProducto(id, data) {
  if (!data.nombre?.trim()) throw new Error("El nombre es obligatorio")

  return db.productos.update({
    where: { id: Number(id) },
    data: {
      nombre:           data.nombre.trim(),
      descripcion:      data.descripcion   ?? null,
      codigo:           data.codigo?.trim() || null,
      precio:           Number(data.precio),
      precio_costo:     Number(data.precio_costo ?? 0),
      stock:            Number(data.stock ?? 0),
      itbis_pct:        Number(data.itbis_pct ?? 18),
      itbis_habilitado: data.itbis_habilitado ?? true,
      categoria_id:     data.categoria_id ?? null,
      marca_id:         data.marca_id     ?? null,
      activo:           data.activo ?? true,
    },
    select: SELECT_PROD,
  })
}

async function generarBarcodeArchivo(id, codigo) {
  const carpeta = path.resolve("public/uploads/barcodes")
  await fs.mkdir(carpeta, { recursive: true })

  const prod = await db.productos.findUnique({ where: { id: Number(id) }, select: { barcode: true } })
  if (prod?.barcode) {
    await fs.unlink(path.resolve(`public${prod.barcode}`)).catch(() => {})
  }

  const canvas = createCanvas(400, 160)
  JsBarcode(canvas, codigo, {
    format: "CODE128",
    lineColor: "#0f172a",
    width: 3,
    height: 100,
    displayValue: true,
    fontSize: 16,
    fontOptions: "bold",
    margin: 16,
    background: "#ffffff",
  })

  const nombre = `barcode_${id}_${Date.now()}.png`
  await fs.writeFile(path.join(carpeta, nombre), canvas.toBuffer("image/png"))
  return `/uploads/barcodes/${nombre}`
}

export async function getSiguienteCodigo(empresaId, nombre) {
  const base = nombre
    .toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8)

  const total = await db.productos.count({ where: { empresa_id: empresaId } })
  let n = total + 1
  let candidato
  while (true) {
    candidato = `${base}-${String(n).padStart(6, "0")}`
    const existe = await db.productos.findFirst({
      where: { empresa_id: empresaId, codigo: candidato },
      select: { id: true },
    })
    if (!existe) break
    n++
  }
  return { codigo: candidato }
}

export async function verificarCodigo(empresaId, codigo, excluirId = null) {
  const where = {
    empresa_id: empresaId,
    codigo,
    ...(excluirId ? { NOT: { id: excluirId } } : {}),
  }
  const existe = await db.productos.findFirst({ where, select: { id: true } })
  return { disponible: !existe }
}

export async function generarBarcode(id) {
  const prod = await db.productos.findUnique({ where: { id: Number(id) }, select: { id: true, codigo: true } })
  if (!prod) throw new Error("Producto no encontrado")

  let codigo = prod.codigo
  if (!codigo) {
    codigo = `PRD-${String(prod.id).padStart(5, "0")}`
    await db.productos.update({ where: { id: Number(id) }, data: { codigo } })
  }

  const url = await generarBarcodeArchivo(Number(id), codigo)
  await db.productos.update({ where: { id: Number(id) }, data: { barcode: url } })
  return { codigo, barcode: url }
}

export async function subirImagenProducto(id, buffer, mimetype) {
  const ext     = mimetype === "image/png" ? "png" : mimetype === "image/webp" ? "webp" : mimetype === "image/svg+xml" ? "svg" : "jpg"
  const nombre  = `producto_${id}_${Date.now()}.${ext}`
  const carpeta = path.resolve("public/uploads/productos")
  await fs.mkdir(carpeta, { recursive: true })

  const prod = await db.productos.findUnique({ where: { id: Number(id) }, select: { imagen: true } })
  if (prod?.imagen) {
    await fs.unlink(path.resolve(`public${prod.imagen}`)).catch(() => {})
  }

  await fs.writeFile(path.join(carpeta, nombre), buffer)
  const url = `/uploads/productos/${nombre}`
  await db.productos.update({ where: { id: Number(id) }, data: { imagen: url } })
  return { url }
}

export async function eliminarProducto(id) {
  const prod = await db.productos.findUnique({ where: { id: Number(id) }, select: { imagen: true, barcode: true } })
  if (prod?.imagen)  await fs.unlink(path.resolve(`public${prod.imagen}`)).catch(() => {})
  if (prod?.barcode) await fs.unlink(path.resolve(`public${prod.barcode}`)).catch(() => {})
  await db.productos.delete({ where: { id: Number(id) } })
  return { ok: true }
}