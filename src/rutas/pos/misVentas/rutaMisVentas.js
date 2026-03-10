import { getMisVentas, cancelarVenta } from "../../../servicios/pos/misVentas/servicioMisVentas.js"

export default async function rutaMisVentas(app) {
  app.get("/:empresaId/:usuarioId/:tipoUsuarioId", async (req, reply) => {
    try {
      const { fechaDesde, fechaHasta, estado, pagina = "1", limite = "20" } = req.query
      const data = await getMisVentas({
        empresaId:     Number(req.params.empresaId),
        usuarioId:     Number(req.params.usuarioId),
        tipoUsuarioId: Number(req.params.tipoUsuarioId),
        fechaDesde,
        fechaHasta,
        estado,
        pagina:  Number(pagina),
        limite:  Number(limite),
      })
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.patch("/cancelar/:ventaId/:empresaId", async (req, reply) => {
    try {
      const result = await cancelarVenta(Number(req.params.ventaId), Number(req.params.empresaId))
      return reply.send(result)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })
}