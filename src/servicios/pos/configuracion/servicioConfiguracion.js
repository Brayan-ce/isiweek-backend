import db from "../../../_Db/db.js"
import fs from "fs/promises"
import path from "path"

const PUBLIC_DIR = path.join(process.cwd(), "public")

export async function getEmpresa(empresaId) {
  return db.empresas.findUnique({
    where: { id: empresaId },
    select: {
      id: true, nombre: true, rnc: true, razon_social: true,
      telefono: true, email: true, direccion: true,
      pais: true, estado_geo: true, ciudad: true,
      moneda_id: true, estado: true,
      moneda: { select: { id: true, nombre: true, codigo: true, simbolo: true } },
      configuracion: { select: { clave: true, valor: true } },
    },
  })
}

export async function getMonedas() {
  return db.monedas.findMany({ orderBy: { nombre: "asc" } })
}

export async function guardarEmpresa(empresaId, data) {
  if (!data.nombre?.trim()) throw new Error("El nombre es obligatorio")
  return db.empresas.update({
    where: { id: empresaId },
    data: {
      nombre:       data.nombre.trim(),
      rnc:          data.rnc?.trim()          || null,
      razon_social: data.razon_social?.trim() || null,
      telefono:     data.telefono?.trim()     || null,
      email:        data.email?.trim()        || null,
      direccion:    data.direccion?.trim()    || null,
      pais:         data.pais?.trim()         || null,
      estado_geo:   data.estado_geo?.trim()   || null,
      ciudad:       data.ciudad?.trim()       || null,
      moneda_id:    Number(data.moneda_id),
    },
    select: {
      id: true, nombre: true, rnc: true, razon_social: true,
      telefono: true, email: true, direccion: true,
      pais: true, estado_geo: true, ciudad: true, moneda_id: true,
      moneda: { select: { id: true, nombre: true, codigo: true, simbolo: true } },
    },
  })
}

export async function subirLogoEmpresa(empresaId, req) {
  const data = await req.file()
  if (!data) throw new Error("No se recibio ningun archivo")

  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]
  if (!allowed.includes(data.mimetype)) throw new Error("Formato no permitido")

  let ext = "jpg"
  if (data.mimetype === "image/png")      ext = "png"
  else if (data.mimetype === "image/webp") ext = "webp"
  else if (data.mimetype === "image/svg+xml") ext = "svg"

  const fileName = `logo_empresa_${empresaId}_${Date.now()}.${ext}`
  const destDir  = path.join(PUBLIC_DIR, "uploads", "empresas")
  await fs.mkdir(destDir, { recursive: true })

  const empresa = await db.empresas.findUnique({
    where: { id: empresaId },
    select: { configuracion: { where: { clave: "logo" }, select: { valor: true } } },
  })
  const logoAnterior = empresa?.configuracion?.[0]?.valor
  if (logoAnterior) {
    const rutaAnterior = path.join(PUBLIC_DIR, logoAnterior)
    await fs.unlink(rutaAnterior).catch(() => {})
  }

  const chunks = []
  for await (const chunk of data.file) chunks.push(chunk)
  const buffer = Buffer.concat(chunks)
  if (buffer.length === 0) throw new Error("El archivo esta vacio")

  await fs.writeFile(path.join(destDir, fileName), buffer)

  const url = `/uploads/empresas/${fileName}`
  await db.configuracion.upsert({
    where:  { empresa_id_clave: { empresa_id: empresaId, clave: "logo" } },
    update: { valor: url },
    create: { empresa_id: empresaId, clave: "logo", valor: url },
  })
  return { url }
}