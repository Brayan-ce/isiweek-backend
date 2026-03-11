import { getDashboardCreditos } from "../../../../servicios/pos/creditos/dashboard/servicioDashboardCreditos.js"

export default async function rutaDashboardCreditos(app) {
  app.get("/:empresaId", async (req, reply) => {
    try {
      const data = await getDashboardCreditos(Number(req.params.empresaId))
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })
}