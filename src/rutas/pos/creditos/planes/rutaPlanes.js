import {
  getPlanes, crearPlan, editarPlan,
  eliminarPlan, toggleActivoPlan,
} from "../../../../servicios/pos/creditos/planes/servicioPlanes.js"

export default async function rutaPlanes(app) {
  app.get("/:empresaId", async (req, reply) => {
    try {
      return reply.send(await getPlanes(Number(req.params.empresaId)))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.post("/:empresaId", async (req, reply) => {
    try {
      return reply.status(201).send(await crearPlan(Number(req.params.empresaId), req.body))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.put("/:id", async (req, reply) => {
    try {
      return reply.send(await editarPlan(Number(req.params.id), req.body))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.patch("/:id/toggle", async (req, reply) => {
    try {
      return reply.send(await toggleActivoPlan(Number(req.params.id), req.body.activo))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.delete("/:id", async (req, reply) => {
    try {
      return reply.send(await eliminarPlan(Number(req.params.id)))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })
}