import { obtenerDatosHeader } from "../../../servicios/pos/header/servicioHeader.js"

export default async function rutaPosHeader(app) {
  app.get("/:usuarioId", async (req, reply) => {
    try {
      const data = await obtenerDatosHeader(Number(req.params.usuarioId))
      return reply.send(data)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })
}