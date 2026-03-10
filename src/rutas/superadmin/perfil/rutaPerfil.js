import {
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
} from "../../../servicios/superadmin/perfil/servicioPerfil.js"

export default async function rutaPerfil(app) {
  app.get("/:id", async (req, reply) => {
    const perfil = await obtenerPerfil(Number(req.params.id))
    if (!perfil) return reply.status(404).send({ error: "Usuario no encontrado" })
    return reply.send(perfil)
  })

  app.put("/:id", async (req, reply) => {
    try {
      const perfil = await actualizarPerfil(Number(req.params.id), req.body)
      return reply.send(perfil)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.patch("/:id/password", async (req, reply) => {
    try {
      const result = await cambiarPassword(Number(req.params.id), req.body)
      return reply.send(result)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })
}