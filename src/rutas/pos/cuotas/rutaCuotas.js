import {
  getDatosCuota,
  crearVentaCuotas,
  getVentasCuotas,
  pagarCuota,
  getUsuariosEmpresa,
  editarEstadoCuota,
  getVentaCuota,
} from "../../../servicios/pos/cuotas/servicioCuotas.js"

export default async function rutaCuotas(app) {
  app.get("/datos/:empresaId", async (req, reply) => {
    try {
      return reply.send(await getDatosCuota(Number(req.params.empresaId)))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.get("/lista/:empresaId", async (req, reply) => {
    try {
      const { cliente_id, estado, fecha_desde, fecha_hasta, usuario_id, pagina, limite } = req.query
      return reply.send(await getVentasCuotas(Number(req.params.empresaId), {
        cliente_id, estado, fecha_desde, fecha_hasta, usuario_id, pagina, limite,
      }))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.get("/usuarios/:empresaId", async (req, reply) => {
    try {
      return reply.send(await getUsuariosEmpresa(Number(req.params.empresaId)))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.post("/crear/:empresaId/:usuarioId", async (req, reply) => {
    try {
      return reply.status(201).send(await crearVentaCuotas(
        Number(req.params.empresaId),
        Number(req.params.usuarioId),
        req.body
      ))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.patch("/pagar/:empresaId/:cuotaId", async (req, reply) => {
    try {
      return reply.send(await pagarCuota(
        Number(req.params.empresaId),
        Number(req.params.cuotaId),
        req.body
      ))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.patch("/editar-cuota/:empresaId/:cuotaId", async (req, reply) => {
    try {
      return reply.send(await editarEstadoCuota(
        Number(req.params.empresaId),
        Number(req.params.cuotaId),
        req.body.estado
      ))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.get("/imprimir/:empresaId/:ventaId", async (req, reply) => {
    try {
      return reply.send(await getVentaCuota(
        Number(req.params.ventaId),
        Number(req.params.empresaId)
      ))
    } catch (err) { return reply.status(404).send({ error: err.message }) }
  })
}