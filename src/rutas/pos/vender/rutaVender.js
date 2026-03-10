import {
  getProductos,
  getProductoPorCodigo,
  getDatosVender,
  crearVenta,
  crearClienteRapido,
  actualizarStockProducto,
  getVentaRecibo,
} from "../../../servicios/pos/vender/servicioVender.js"

export default async function rutaVender(app) {
  app.get("/datos/:empresaId/:usuarioId", async (req, reply) => {
    try {
      return reply.send(await getDatosVender(Number(req.params.empresaId), Number(req.params.usuarioId)))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.get("/productos/:empresaId", async (req, reply) => {
    try {
      const { busqueda = "", pagina = "1", limite = "20" } = req.query
      return reply.send(await getProductos(Number(req.params.empresaId), busqueda, Number(pagina), Number(limite)))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.get("/codigo/:empresaId/:codigo", async (req, reply) => {
    try {
      return reply.send(await getProductoPorCodigo(Number(req.params.empresaId), req.params.codigo))
    } catch (err) { return reply.status(404).send({ error: err.message }) }
  })

  app.get("/recibo/:id", async (req, reply) => {
    try {
      return reply.send(await getVentaRecibo(Number(req.params.id)))
    } catch (err) { return reply.status(404).send({ error: err.message }) }
  })

  app.post("/cliente-rapido/:empresaId", async (req, reply) => {
    try {
      return reply.status(201).send(await crearClienteRapido(Number(req.params.empresaId), req.body.nombre))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.patch("/stock/:empresaId/:productoId", async (req, reply) => {
    try {
      return reply.send(await actualizarStockProducto(Number(req.params.empresaId), Number(req.params.productoId), req.body.stock))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.post("/crear/:empresaId/:usuarioId", async (req, reply) => {
    try {
      return reply.status(201).send(await crearVenta(Number(req.params.empresaId), Number(req.params.usuarioId), req.body))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })
}