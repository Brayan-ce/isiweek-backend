import { obtenerDatosDashboard } from "../../../servicios/superadmin/dashboard/servicioDashboard.js"

export default async function rutaDashboard(app) {
  app.get("/datos", async (req, reply) => {
    try {
      const datos = await obtenerDatosDashboard()
      return reply.send(datos)
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({ error: "Error al obtener datos del dashboard" })
    }
  })
}