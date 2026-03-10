import {
  getClientes,
  crearCliente,
  editarCliente,
  eliminarCliente,
} from "../../../servicios/pos/clientes/servicioClientes.js"

export default async function rutaClientes(app) {
  app.get("/lista/:empresaId", async (req, reply) => {
    try {
      const { busqueda, pagina, limite } = req.query
      return reply.send(
        await getClientes(Number(req.params.empresaId), { busqueda, pagina, limite })
      )
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.post("/crear/:empresaId", async (req, reply) => {
    try {
      return reply
        .status(201)
        .send(await crearCliente(Number(req.params.empresaId), req.body))
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.patch("/editar/:empresaId/:clienteId", async (req, reply) => {
    try {
      return reply.send(
        await editarCliente(
          Number(req.params.empresaId),
          Number(req.params.clienteId),
          req.body
        )
      )
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.delete("/eliminar/:empresaId/:clienteId", async (req, reply) => {
    try {
      return reply.send(
        await eliminarCliente(
          Number(req.params.empresaId),
          Number(req.params.clienteId)
        )
      )
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })
}