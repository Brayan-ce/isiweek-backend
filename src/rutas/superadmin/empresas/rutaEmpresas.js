import {
  listarEmpresas,
  obtenerEmpresa,
  crearEmpresa,
  actualizarEmpresa,
  eliminarEmpresa,
  listarMonedas,
  listarModulos,
} from "../../../servicios/superadmin/empresas/servicioEmpresas.js"

export default async function rutaEmpresas(app) {
  app.get("/", async (req, reply) => {
    const { busqueda = "", estado = "", pagina = 1, limite = 12 } = req.query
    const data = await listarEmpresas({
      busqueda,
      estado,
      pagina: Number(pagina),
      limite: Number(limite),
    })
    return reply.send(data)
  })

  app.get("/monedas", async (req, reply) => {
    const data = await listarMonedas()
    return reply.send(data)
  })

  app.get("/modulos", async (req, reply) => {
    const data = await listarModulos()
    return reply.send(data)
  })

  app.get("/:id", async (req, reply) => {
    const empresa = await obtenerEmpresa(Number(req.params.id))
    if (!empresa) return reply.status(404).send({ error: "Empresa no encontrada" })
    return reply.send(empresa)
  })

  app.post("/", async (req, reply) => {
    try {
      const empresa = await crearEmpresa(req.body)
      return reply.status(201).send(empresa)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.put("/:id", async (req, reply) => {
    try {
      const empresa = await actualizarEmpresa(Number(req.params.id), req.body)
      return reply.send(empresa)
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.delete("/:id", async (req, reply) => {
    try {
      await eliminarEmpresa(Number(req.params.id))
      return reply.send({ ok: true })
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })
}