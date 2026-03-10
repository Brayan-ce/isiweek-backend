import {
  getDatosCaja,
  abrirCaja,
  cerrarCaja,
  registrarGasto,
  getHistorialCajas,
} from "../../../servicios/pos/cajas/servicioCajas.js"
export default async function rutaCajas(app) {
  app.get("/datos/:usuarioId/:empresaId", async (req, reply) => {
    try {
      const data = await getDatosCaja(Number(req.params.usuarioId), Number(req.params.empresaId))
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.post("/abrir", async (req, reply) => {
    try {
      const { usuarioId, empresaId, montoInicial } = req.body
      const sesion = await abrirCaja(Number(usuarioId), Number(empresaId), montoInicial)
      return reply.status(201).send(sesion)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.patch("/cerrar", async (req, reply) => {
    try {
      const { sesionId, usuarioId } = req.body
      const result = await cerrarCaja(Number(sesionId), Number(usuarioId))
      return reply.send(result)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.post("/gasto", async (req, reply) => {
    try {
      const { usuarioId, empresaId, concepto, monto, tipo } = req.body
      const gasto = await registrarGasto(Number(usuarioId), Number(empresaId), concepto, monto, tipo)
      return reply.status(201).send(gasto)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.get("/historial/:usuarioId/:empresaId", async (req, reply) => {
    try {
      const { pagina = "1", limite = "10" } = req.query
      const data = await getHistorialCajas(
        Number(req.params.usuarioId),
        Number(req.params.empresaId),
        Number(pagina),
        Number(limite)
      )
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })
}