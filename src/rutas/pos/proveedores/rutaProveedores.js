import {
  getProveedores,
  crearProveedor,
  editarProveedor,
  eliminarProveedor,
} from "../../../servicios/pos/proveedores/servicioProveedores.js"

export default async function rutaProveedores(app) {
  app.get("/lista/:empresaId", async (req, reply) => {
    try {
      const { busqueda, pagina, limite } = req.query
      return reply.send(
        await getProveedores(Number(req.params.empresaId), { busqueda, pagina, limite })
      )
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.post("/crear/:empresaId", async (req, reply) => {
    try {
      return reply
        .status(201)
        .send(await crearProveedor(Number(req.params.empresaId), req.body))
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.patch("/editar/:empresaId/:proveedorId", async (req, reply) => {
    try {
      return reply.send(
        await editarProveedor(
          Number(req.params.empresaId),
          Number(req.params.proveedorId),
          req.body
        )
      )
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.delete("/eliminar/:empresaId/:proveedorId", async (req, reply) => {
    try {
      return reply.send(
        await eliminarProveedor(
          Number(req.params.empresaId),
          Number(req.params.proveedorId)
        )
      )
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })
}