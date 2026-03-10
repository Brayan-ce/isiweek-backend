import {
  getMarcas,
  crearMarca,
  editarMarca,
  eliminarMarca,
} from "../../../servicios/pos/marcas/servicioMarcas.js"

export default async function rutaMarcas(app) {
  app.get("/:empresaId", async (req, reply) => {
    try {
      const { busqueda = "", pagina = "1", limite = "20" } = req.query
      return reply.send(await getMarcas(Number(req.params.empresaId), busqueda, Number(pagina), Number(limite)))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.post("/:empresaId", async (req, reply) => {
    try {
      return reply.status(201).send(await crearMarca(Number(req.params.empresaId), req.body.nombre))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.put("/:id", async (req, reply) => {
    try {
      return reply.send(await editarMarca(Number(req.params.id), req.body.nombre))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.delete("/:id", async (req, reply) => {
    try {
      return reply.send(await eliminarMarca(Number(req.params.id)))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })
}