import { obtenerDatosHeader } from "../../../servicios/superadmin/header/servicioHeader.js"

export default async function rutaHeader(app) {
  app.get("/datos", async (req, reply) => {
    try {
      const datos = await obtenerDatosHeader()
      return reply.send(datos)
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({ error: "Error al obtener datos del header" })
    }
  })
}