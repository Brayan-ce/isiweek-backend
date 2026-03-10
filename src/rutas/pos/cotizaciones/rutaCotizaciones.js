import {
  getCotizaciones,
  getCotizacion,
  getDatosCotizar,
  crearCotizacion,
  actualizarCotizacion,
  cambiarEstadoCotizacion,
  eliminarCotizacion,
  convertirAVenta,
} from "../../../servicios/pos/cotizaciones/servicioCotizaciones.js"

export default async function rutaCotizaciones(app) {
  app.get("/:empresaId", async (req, reply) => {
    try {
      return reply.send(await getCotizaciones(Number(req.params.empresaId), req.query))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.get("/datos/:empresaId/:usuarioId", async (req, reply) => {
    try {
      return reply.send(await getDatosCotizar(Number(req.params.empresaId), Number(req.params.usuarioId)))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.get("/ver/:id", async (req, reply) => {
    try {
      return reply.send(await getCotizacion(Number(req.params.id)))
    } catch (err) { return reply.status(404).send({ error: err.message }) }
  })

  app.post("/crear/:empresaId/:usuarioId", async (req, reply) => {
    try {
      return reply.status(201).send(await crearCotizacion(Number(req.params.empresaId), Number(req.params.usuarioId), req.body))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.put("/editar/:id/:empresaId", async (req, reply) => {
    try {
      return reply.send(await actualizarCotizacion(Number(req.params.id), Number(req.params.empresaId), req.body))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.patch("/estado/:id/:empresaId", async (req, reply) => {
    try {
      return reply.send(await cambiarEstadoCotizacion(Number(req.params.id), Number(req.params.empresaId), req.body.estado))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.delete("/eliminar/:id/:empresaId", async (req, reply) => {
    try {
      await eliminarCotizacion(Number(req.params.id), Number(req.params.empresaId))
      return reply.send({ ok: true })
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.post("/convertir/:id/:empresaId/:usuarioId", async (req, reply) => {
    try {
      return reply.status(201).send(await convertirAVenta(Number(req.params.id), Number(req.params.empresaId), Number(req.params.usuarioId), req.body))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })
}