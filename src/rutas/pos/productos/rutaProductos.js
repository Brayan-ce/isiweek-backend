import multipart from "@fastify/multipart"
import {
  getProductos, getDatosFormulario,
  crearProducto, editarProducto,
  subirImagenProducto, eliminarProducto,
  generarBarcode, verificarCodigo, getSiguienteCodigo,
} from "../../../servicios/pos/productos/servicioProductos.js"

export default async function rutaProductos(app) {
  await app.register(multipart, { limits: { fileSize: 3 * 1024 * 1024 } })

  app.get("/formulario/:empresaId", async (req, reply) => {
    try {
      return reply.send(await getDatosFormulario(Number(req.params.empresaId)))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.get("/siguiente-codigo/:empresaId", async (req, reply) => {
    try {
      const { nombre = "" } = req.query
      return reply.send(await getSiguienteCodigo(Number(req.params.empresaId), nombre))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.get("/verificar-codigo/:empresaId", async (req, reply) => {
    try {
      const { codigo, excluirId } = req.query
      if (!codigo) return reply.send({ disponible: true })
      return reply.send(await verificarCodigo(Number(req.params.empresaId), codigo, excluirId ? Number(excluirId) : null))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.get("/:empresaId", async (req, reply) => {
    try {
      const { busqueda = "", pagina = "1", limite = "20" } = req.query
      return reply.send(await getProductos(Number(req.params.empresaId), busqueda, Number(pagina), Number(limite)))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.post("/:empresaId", async (req, reply) => {
    try {
      return reply.status(201).send(await crearProducto(Number(req.params.empresaId), req.body))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.put("/:id", async (req, reply) => {
    try {
      return reply.send(await editarProducto(Number(req.params.id), req.body))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.post("/:id/barcode", async (req, reply) => {
    try {
      return reply.send(await generarBarcode(Number(req.params.id)))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.post("/:id/imagen", async (req, reply) => {
    try {
      const data = await req.file()
      if (!data) return reply.status(400).send({ error: "No se recibió archivo" })
      const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]
      if (!allowed.includes(data.mimetype))
        return reply.status(400).send({ error: "Formato no permitido. Usa PNG, JPG, WEBP o SVG" })
      const buffer = await data.toBuffer()
      return reply.send(await subirImagenProducto(Number(req.params.id), buffer, data.mimetype))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })

  app.delete("/:id", async (req, reply) => {
    try {
      return reply.send(await eliminarProducto(Number(req.params.id)))
    } catch (err) { return reply.status(400).send({ error: err.message }) }
  })
}