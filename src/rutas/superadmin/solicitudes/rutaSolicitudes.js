import {
  listarSolicitudes,
  obtenerSolicitud,
  aprobarSolicitud,
  rechazarSolicitud,
  pendienteSolicitud,
} from "../../../servicios/superadmin/solicitudes/servicioSolicitudes.js"

export default async function rutaSolicitudes(app) {
  app.get("/", async (req, reply) => {
    const { busqueda = "", estado = "", pagina = 1, limite = 12 } = req.query
    const data = await listarSolicitudes({ busqueda, estado, pagina: Number(pagina), limite: Number(limite) })
    return reply.send(data)
  })

  app.get("/:id", async (req, reply) => {
    const sol = await obtenerSolicitud(Number(req.params.id))
    if (!sol) return reply.status(404).send({ error: "Solicitud no encontrada" })
    return reply.send(sol)
  })

  app.patch("/:id/aprobar", async (req, reply) => {
    try {
      const data = await aprobarSolicitud(Number(req.params.id))
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.patch("/:id/rechazar", async (req, reply) => {
    try {
      const data = await rechazarSolicitud(Number(req.params.id))
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.patch("/:id/pendiente", async (req, reply) => {
    try {
      const data = await pendienteSolicitud(Number(req.params.id))
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })
}