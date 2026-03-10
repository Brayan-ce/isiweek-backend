import {
  getDatosCompra,
  getCompras,
  getCompra,
  crearCompra,
  editarCompra,
  eliminarCompra,
} from "../../../servicios/pos/compras/servicioCompras.js"

export default async function rutaCompras(app) {
  app.get("/datos/:empresaId", async (req, reply) => {
    try {
      return reply.send(await getDatosCompra(Number(req.params.empresaId)))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.get("/lista/:empresaId", async (req, reply) => {
    try {
      const { proveedor_id, estado, fecha_desde, fecha_hasta, pagina, limite } = req.query
      return reply.send(await getCompras(Number(req.params.empresaId), {
        proveedor_id, estado, fecha_desde, fecha_hasta, pagina, limite,
      }))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.get("/ver/:empresaId/:compraId", async (req, reply) => {
    try {
      return reply.send(await getCompra(
        Number(req.params.compraId),
        Number(req.params.empresaId)
      ))
    } catch (err) { return reply.status(404).send({ error: err.message }) }
  })

  app.post("/crear/:empresaId/:usuarioId", async (req, reply) => {
    try {
      return reply.status(201).send(await crearCompra(
        Number(req.params.empresaId),
        Number(req.params.usuarioId),
        req.body
      ))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.patch("/editar/:empresaId/:compraId", async (req, reply) => {
    try {
      return reply.send(await editarCompra(
        Number(req.params.empresaId),
        Number(req.params.compraId),
        req.body
      ))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.delete("/eliminar/:empresaId/:compraId", async (req, reply) => {
    try {
      return reply.send(await eliminarCompra(
        Number(req.params.empresaId),
        Number(req.params.compraId)
      ))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })
}