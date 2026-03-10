import {
  getCategorias,
  crearCategoria,
  editarCategoria,
  eliminarCategoria,
} from "../../../servicios/pos/categorias/servicioCategorias.js"

export default async function rutaCategorias(app) {
  app.get("/:empresaId", async (req, reply) => {
    try {
      const { busqueda = "", pagina = "1", limite = "20" } = req.query
      return reply.send(await getCategorias(Number(req.params.empresaId), busqueda, Number(pagina), Number(limite)))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.post("/:empresaId", async (req, reply) => {
    try {
      return reply.status(201).send(await crearCategoria(Number(req.params.empresaId), req.body.nombre))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.put("/:id", async (req, reply) => {
    try {
      return reply.send(await editarCategoria(Number(req.params.id), req.body.nombre))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.delete("/:id", async (req, reply) => {
    try {
      return reply.send(await eliminarCategoria(Number(req.params.id)))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })
}