import multipart from "@fastify/multipart"
import {
  obtenerConfiguracion,
  actualizarConfiguracion,
  subirLogo,
} from "../../../servicios/superadmin/configuracion/servicioConfiguracion.js"

export default async function rutaConfiguracion(app) {
  await app.register(multipart, { limits: { fileSize: 2 * 1024 * 1024 } })

  app.get("/", async (req, reply) => {
    const config = await obtenerConfiguracion()
    return reply.send(config)
  })

  app.put("/", async (req, reply) => {
    try {
      const config = await actualizarConfiguracion(req.body)
      return reply.send(config)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.post("/logo", async (req, reply) => {
    try {
      const data = await req.file()
      if (!data) return reply.status(400).send({ error: "No se recibió archivo" })

      const allowed = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"]
      if (!allowed.includes(data.mimetype)) {
        return reply.status(400).send({ error: "Formato no permitido. Usa PNG, JPG, SVG o WEBP" })
      }

      const buffer = await data.toBuffer()
      const result = await subirLogo(buffer, data.mimetype)
      return reply.send(result)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })
}