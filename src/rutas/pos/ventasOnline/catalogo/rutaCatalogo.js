import multipart from "@fastify/multipart"
import {
  obtenerConfigCatalogo,
  guardarConfigCatalogo,
  obtenerProductosCatalogo,
  toggleProductoCatalogo,
  subirLogoCatalogo,
  generarQRCatalogo,
} from "../../../../servicios/pos/ventasOnline/catalogo/servicioCatalogo.js"

export default async function rutaCatalogo(app) {
  await app.register(multipart, { limits: { fileSize: 2 * 1024 * 1024 } })

  app.get("/config/:empresaId", async (req, reply) => {
    try {
      const data = await obtenerConfigCatalogo(Number(req.params.empresaId))
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.put("/config/:empresaId", async (req, reply) => {
    try {
      const data = await guardarConfigCatalogo(Number(req.params.empresaId), req.body)
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.get("/productos/:empresaId", async (req, reply) => {
    try {
      const data = await obtenerProductosCatalogo(Number(req.params.empresaId))
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.patch("/productos/:empresaId/:productoId", async (req, reply) => {
    try {
      const data = await toggleProductoCatalogo(
        Number(req.params.empresaId),
        Number(req.params.productoId),
        req.body
      )
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.post("/logo/:empresaId", async (req, reply) => {
    try {
      const data = await subirLogoCatalogo(Number(req.params.empresaId), req)
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.post("/qr", async (req, reply) => {
    try {
      const { url } = req.body
      if (!url) return reply.status(400).send({ error: "URL requerida" })
      const data = await generarQRCatalogo(url)
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })
}