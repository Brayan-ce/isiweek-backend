import {
  obtenerConfigPorSlug,
  obtenerProductosPorSlug,
  crearPedidoCatalogo,
} from "../../servicios/catalogo/servicioCatalogoPublico.js"

export default async function rutaCatalogoPublico(app) {

  app.get("/:slug/config", async (req, reply) => {
    try {
      const data = await obtenerConfigPorSlug(req.params.slug)
      return reply.send(data)
    } catch (err) {
      return reply.status(404).send({ error: err.message })
    }
  })

  app.get("/:slug/productos", async (req, reply) => {
    try {
      const data = await obtenerProductosPorSlug(req.params.slug)
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.post("/pedido", async (req, reply) => {
    try {
      const data = await crearPedidoCatalogo(req.body)
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })
}