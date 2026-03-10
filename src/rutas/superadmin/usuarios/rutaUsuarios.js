import {
  listarUsuarios,
  obtenerUsuario,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  listarTiposUsuario,
  listarModosSistema,
} from "../../../servicios/superadmin/usuarios/servicioUsuarios.js"
import { listarEmpresas } from "../../../servicios/superadmin/empresas/servicioEmpresas.js"

export default async function rutaUsuarios(app) {
  app.get("/", async (req, reply) => {
    const { busqueda = "", estado = "", tipo = "", pagina = 1, limite = 12 } = req.query
    const data = await listarUsuarios({ busqueda, estado, tipo, pagina: Number(pagina), limite: Number(limite) })
    return reply.send(data)
  })

  app.get("/tipos", async (req, reply) => {
    return reply.send(await listarTiposUsuario())
  })

  app.get("/modos", async (req, reply) => {
    return reply.send(await listarModosSistema())
  })

  app.get("/empresas", async (req, reply) => {
    const data = await listarEmpresas({ estado: "activa", limite: 200 })
    return reply.send(data.empresas)
  })

  app.get("/:id", async (req, reply) => {
    const usuario = await obtenerUsuario(Number(req.params.id))
    if (!usuario) return reply.status(404).send({ error: "Usuario no encontrado" })
    return reply.send(usuario)
  })

  app.post("/", async (req, reply) => {
    try {
      const usuario = await crearUsuario(req.body)
      return reply.status(201).send(usuario)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.put("/:id", async (req, reply) => {
    try {
      const usuario = await actualizarUsuario(Number(req.params.id), req.body)
      return reply.send(usuario)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.delete("/:id", async (req, reply) => {
    try {
      await eliminarUsuario(Number(req.params.id))
      return reply.send({ ok: true })
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })
}