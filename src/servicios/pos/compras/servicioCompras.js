import db from "../../../_Db/db.js"

export async function getDatosCompra(empresaId) {
  const [proveedores, productos] = await Promise.all([
    db.proveedores.findMany({
      where: { empresa_id: empresaId },
      select: { id: true, nombre: true, rnc: true },
      orderBy: { nombre: "asc" },
    }),
    db.productos.findMany({
      where: { empresa_id: empresaId, activo: true },
      select: { id: true, nombre: true, codigo: true, precio_costo: true, stock: true },
      orderBy: { nombre: "asc" },
    }),
  ])
  return { proveedores, productos }
}

export async function getCompras(empresaId, filtros = {}) {
  const { proveedor_id, estado, fecha_desde, fecha_hasta, pagina = 1, limite = 20 } = filtros
  const skip = (Number(pagina) - 1) * Number(limite)

  const where = {
    empresa_id: empresaId,
    ...(proveedor_id ? { proveedor_id: Number(proveedor_id) } : {}),
    ...(estado ? { estado } : {}),
    ...(fecha_desde || fecha_hasta ? {
      created_at: {
        ...(fecha_desde ? { gte: new Date(fecha_desde) } : {}),
        ...(fecha_hasta ? { lte: new Date(fecha_hasta + "T23:59:59") } : {}),
      },
    } : {}),
  }

  const [compras, total] = await Promise.all([
    db.compras.findMany({
      where,
      skip,
      take: Number(limite),
      orderBy: { created_at: "desc" },
      include: {
        proveedor: { select: { nombre: true, rnc: true } },
        usuario: { select: { nombre_completo: true } },
        compra_detalles: { select: { id: true, nombre_producto: true, cantidad: true, precio_unitario: true, subtotal: true } },
      },
    }),
    db.compras.count({ where }),
  ])

  return {
    compras: compras.map(c => ({
      ...c,
      items_count: c.compra_detalles.length,
    })),
    total,
    paginas: Math.ceil(total / Number(limite)),
  }
}

export async function getCompra(ventaId, empresaId) {
  const compra = await db.compras.findFirst({
    where: { id: Number(ventaId), empresa_id: empresaId },
    include: {
      proveedor: true,
      usuario: { select: { nombre_completo: true } },
      compra_detalles: { include: { producto: { select: { nombre: true, codigo: true } } } },
    },
  })
  if (!compra) throw new Error("Compra no encontrada")
  return compra
}

export async function crearCompra(empresaId, usuarioId, body) {
  const { proveedor_id, estado = "completada", items } = body

  if (!items?.length) throw new Error("Debes agregar al menos un producto")

  const total = items.reduce((a, i) => a + Number(i.precio_unitario) * Number(i.cantidad), 0)

  return db.$transaction(async tx => {
    const compra = await tx.compras.create({
      data: {
        empresa_id: empresaId,
        usuario_id: usuarioId,
        proveedor_id: proveedor_id ? Number(proveedor_id) : null,
        total,
        estado,
      },
    })

    await tx.compra_detalles.createMany({
      data: items.map(i => ({
        compra_id: compra.id,
        producto_id: i.producto_id ? Number(i.producto_id) : null,
        nombre_producto: i.nombre_producto,
        cantidad: Number(i.cantidad),
        precio_unitario: Number(i.precio_unitario),
        subtotal: Number(i.precio_unitario) * Number(i.cantidad),
      })),
    })

    if (estado === "completada") {
      for (const i of items) {
        if (i.producto_id) {
          await tx.productos.update({
            where: { id: Number(i.producto_id) },
            data: { stock: { increment: Number(i.cantidad) } },
          })
        }
      }
    }

    return tx.compras.findUnique({
      where: { id: compra.id },
      include: {
        proveedor: { select: { nombre: true } },
        usuario: { select: { nombre_completo: true } },
        compra_detalles: true,
      },
    })
  })
}

export async function editarCompra(empresaId, compraId, body) {
  const { estado } = body

  const compra = await db.compras.findFirst({
    where: { id: Number(compraId), empresa_id: empresaId },
    include: { compra_detalles: true },
  })
  if (!compra) throw new Error("Compra no encontrada")

  return db.$transaction(async tx => {
    if (estado === "completada" && compra.estado !== "completada") {
      for (const d of compra.compra_detalles) {
        if (d.producto_id) {
          await tx.productos.update({
            where: { id: d.producto_id },
            data: { stock: { increment: d.cantidad } },
          })
        }
      }
    }

    if (estado === "cancelada" && compra.estado === "completada") {
      for (const d of compra.compra_detalles) {
        if (d.producto_id) {
          await tx.productos.update({
            where: { id: d.producto_id },
            data: { stock: { decrement: d.cantidad } },
          })
        }
      }
    }

    return tx.compras.update({
      where: { id: Number(compraId) },
      data: { estado },
    })
  })
}

export async function eliminarCompra(empresaId, compraId) {
  const compra = await db.compras.findFirst({
    where: { id: Number(compraId), empresa_id: empresaId },
    include: { compra_detalles: true },
  })
  if (!compra) throw new Error("Compra no encontrada")
  if (compra.estado === "completada") throw new Error("No se puede eliminar una compra completada")

  return db.compras.delete({ where: { id: Number(compraId) } })
}