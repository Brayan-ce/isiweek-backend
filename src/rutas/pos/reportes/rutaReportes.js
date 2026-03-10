import { getReporteVentas, getReporteProductos, getReporteClientes, getReporteGastos } from "../../../servicios/pos/reportes/servicioReportes.js"

export default async function rutaReportes(app) {
  app.get("/ventas/:empresaId", async (req, reply) => {
    try {
      const data = await getReporteVentas(Number(req.params.empresaId), req.query.periodo, req.query.año, req.query.mes)
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.get("/productos/:empresaId", async (req, reply) => {
    try {
      const data = await getReporteProductos(Number(req.params.empresaId), req.query.periodo, req.query.año, req.query.mes)
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.get("/clientes/:empresaId", async (req, reply) => {
    try {
      const data = await getReporteClientes(Number(req.params.empresaId), req.query.periodo, req.query.año, req.query.mes)
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.get("/gastos/:empresaId", async (req, reply) => {
    try {
      const data = await getReporteGastos(Number(req.params.empresaId), req.query.periodo, req.query.año, req.query.mes)
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })
}