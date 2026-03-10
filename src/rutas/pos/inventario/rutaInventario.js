import {
  getInventario,
  getCategoriasMarcas,
  ajustarStock,
} from "../../../servicios/pos/inventario/servicioInventario.js"

export default async function rutaInventario(app) {
  app.get("/lista/:empresaId", async (req, reply) => {
    try {
      const { busqueda, categoria_id, marca_id, stock_filtro, pagina, limite } = req.query
      return reply.send(
        await getInventario(Number(req.params.empresaId), {
          busqueda, categoria_id, marca_id, stock_filtro, pagina, limite,
        })
      )
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.get("/filtros/:empresaId", async (req, reply) => {
    try {
      return reply.send(await getCategoriasMarcas(Number(req.params.empresaId)))
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.patch("/ajustar/:empresaId/:productoId", async (req, reply) => {
    try {
      const { cantidad } = req.body
      return reply.send(
        await ajustarStock(
          Number(req.params.empresaId),
          Number(req.params.productoId),
          cantidad
        )
      )
    } catch (err) {
      return reply.status(400).send({ error: err.message })
    }
  })
}