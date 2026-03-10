import {
  obtenerEstadoBD,
  obtenerLogs,
  limpiarLogs,
} from "../../../servicios/superadmin/depuracion/servicioDepuracion.js"

export default async function rutaDepuracion(app) {
  app.get("/bd", async (req, reply) => {
    const data = await obtenerEstadoBD()
    return reply.send(data)
  })

  app.get("/logs", async (req, reply) => {
    return reply.send(obtenerLogs())
  })

  app.delete("/logs", async (req, reply) => {
    limpiarLogs()
    return reply.send({ ok: true })
  })
}