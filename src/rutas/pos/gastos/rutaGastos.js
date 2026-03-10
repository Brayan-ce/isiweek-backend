import {
  getGastos,
  getTiposGasto,
  crearGasto,
  editarGasto,
  eliminarGasto,
  getResumenGastos,
} from "../../../servicios/pos/gastos/servicioGastos.js"

export default async function rutaGastos(app) {
  app.get("/lista/:empresaId", async (req, reply) => {
    try {
      const { busqueda, tipo, pagina, limite } = req.query
      return reply.send(
        await getGastos(Number(req.params.empresaId), { busqueda, tipo, pagina, limite })
      )
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.get("/tipos/:empresaId", async (req, reply) => {
    try {
      return reply.send(await getTiposGasto(Number(req.params.empresaId)))
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.get("/resumen/:empresaId", async (req, reply) => {
    try {
      return reply.send(await getResumenGastos(Number(req.params.empresaId)))
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.post("/crear/:empresaId/:usuarioId", async (req, reply) => {
    try {
      return reply
        .status(201)
        .send(await crearGasto(
          Number(req.params.usuarioId),
          Number(req.params.empresaId),
          req.body
        ))
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.patch("/editar/:empresaId/:gastoId", async (req, reply) => {
    try {
      return reply.send(
        await editarGasto(
          Number(req.params.empresaId),
          Number(req.params.gastoId),
          req.body
        )
      )
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.delete("/eliminar/:empresaId/:gastoId", async (req, reply) => {
    try {
      return reply.send(
        await eliminarGasto(
          Number(req.params.empresaId),
          Number(req.params.gastoId)
        )
      )
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })
}