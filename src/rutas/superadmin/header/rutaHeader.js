import { jwtVerify } from "jose"
import { obtenerDatosHeader } from "../../../servicios/superadmin/header/servicioHeader.js"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
console.log(JWT_SECRET)
export default async function rutaHeader(app) {
  app.get("/datos", async (req, reply) => {
    try {
      const auth = req.headers.authorization
      if (!auth?.startsWith("Bearer ")) return reply.status(401).send({ error: "No autorizado" })

      const token = auth.slice(7)
      const { payload } = await jwtVerify(token, JWT_SECRET)
      if (payload.tipo !== "Super Admin") return reply.status(403).send({ error: "Sin permiso" })

      const datos = await obtenerDatosHeader()
      return reply.send(datos)
    } catch (err) {
      if (err.code?.startsWith("ERR_JWT")) return reply.status(401).send({ error: "Token invalido o expirado" })
      req.log.error(err)
      return reply.status(500).send({ error: "Error al obtener datos del header" })
    }
  })
}