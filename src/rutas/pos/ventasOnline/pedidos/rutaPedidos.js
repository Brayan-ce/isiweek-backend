import {
  obtenerPedidos,
  obtenerPedido,
  cambiarEstadoPedido,
  obtenerResumenPedidos,
} from "../../../../servicios/pos/ventasOnline/pedidos/servicioPedidos.js"

export default async function rutaPedidos(app) {

  app.get("/lista/:empresaId", async (req, reply) => {
    try {
      const data = await obtenerPedidos(Number(req.params.empresaId), req.query)
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.get("/resumen/:empresaId", async (req, reply) => {
    try {
      const data = await obtenerResumenPedidos(Number(req.params.empresaId))
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.get("/:empresaId/:pedidoId", async (req, reply) => {
    try {
      const data = await obtenerPedido(Number(req.params.empresaId), Number(req.params.pedidoId))
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.patch("/:empresaId/:pedidoId/estado", async (req, reply) => {
    try {
      const data = await cambiarEstadoPedido(
        Number(req.params.empresaId),
        Number(req.params.pedidoId),
        req.body.estado
      )
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })
}