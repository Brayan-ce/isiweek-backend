import multipart from "@fastify/multipart"
import {
  getEmpresa, getMonedas,
  guardarEmpresa, subirLogoEmpresa,
} from "../../../servicios/pos/configuracion/servicioConfiguracion.js"

export default async function rutaConfiguracionPos(app) {
  await app.register(multipart, { limits: { fileSize: 2 * 1024 * 1024 } })

  app.get("/monedas", async (req, reply) => {
    try { return reply.send(await getMonedas()) }
    catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.get("/:empresaId", async (req, reply) => {
    try { return reply.send(await getEmpresa(Number(req.params.empresaId))) }
    catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.put("/:empresaId", async (req, reply) => {
    try { return reply.send(await guardarEmpresa(Number(req.params.empresaId), req.body)) }
    catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.post("/:empresaId/logo", async (req, reply) => {
    try { return reply.send(await subirLogoEmpresa(Number(req.params.empresaId), req)) }
    catch (err) { return reply.status(400).send({ error: err.message }) }
  })
}