import {
  getUsuarios, crearUsuario, editarUsuario,
  toggleUsuario, resetPassword,
} from "../../../servicios/pos/usuarios/servicioUsuarios.js"

export default async function rutaUsuariosPos(app) {
  app.get("/:empresaId", async (req, reply) => {
    try { return reply.send(await getUsuarios(Number(req.params.empresaId))) }
    catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.post("/:empresaId", async (req, reply) => {
    try { return reply.status(201).send(await crearUsuario(Number(req.params.empresaId), req.body)) }
    catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.put("/:id", async (req, reply) => {
    try { return reply.send(await editarUsuario(Number(req.params.id), req.body)) }
    catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.patch("/:id/toggle", async (req, reply) => {
    try { return reply.send(await toggleUsuario(Number(req.params.id), req.body.estado)) }
    catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.patch("/:id/reset-password", async (req, reply) => {
    try { return reply.send(await resetPassword(Number(req.params.id), req.body.password)) }
    catch (err) { return reply.status(400).send({ error: err.message }) }
  })
}