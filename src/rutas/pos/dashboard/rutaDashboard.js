import { getDashboardAdmin, getDashboardVendedor } from "../../../servicios/pos/dashboard/servicioDashboard.js"

export default async function rutaPosDashboard(app) {
  app.get("/admin/:empresaId", async (req, reply) => {
    try {
      const data = await getDashboardAdmin(Number(req.params.empresaId))
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.get("/vendedor/:usuarioId/:empresaId", async (req, reply) => {
    try {
      const data = await getDashboardVendedor(Number(req.params.usuarioId), Number(req.params.empresaId))
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })
}