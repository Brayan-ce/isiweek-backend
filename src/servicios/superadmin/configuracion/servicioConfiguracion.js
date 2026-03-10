import db from "../../../_Db/db.js"
import fs from "fs/promises"
import path from "path"

const CLAVES = ["sistema_nombre", "sistema_logo", "sistema_email", "whatsapp_numero", "whatsapp_mensaje"]

export async function obtenerConfiguracion() {
  const rows = await db.sistema_config.findMany({
    where: { clave: { in: CLAVES } },
  })
  const config = {}
  for (const row of rows) config[row.clave] = row.valor
  return config
}

export async function actualizarConfiguracion(data) {
  const ops = Object.entries(data)
    .filter(([clave]) => CLAVES.includes(clave))
    .map(([clave, valor]) =>
      db.sistema_config.upsert({
        where: { clave },
        update: { valor },
        create: { clave, valor },
      })
    )
  await Promise.all(ops)
  return obtenerConfiguracion()
}

export async function subirLogo(buffer, mimetype) {
  const ext = mimetype === "image/png" ? "png" : mimetype === "image/svg+xml" ? "svg" : "jpg"
  const nombre = `logo.${ext}`
  const carpeta = path.resolve("public/uploads")
  await fs.mkdir(carpeta, { recursive: true })
  await fs.writeFile(path.join(carpeta, nombre), buffer)

  const url = `/uploads/${nombre}`
  await db.sistema_config.upsert({
    where: { clave: "sistema_logo" },
    update: { valor: url },
    create: { clave: "sistema_logo", valor: url },
  })
  return { url }
}