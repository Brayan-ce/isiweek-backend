import db from "../../../_Db/db.js"

export async function getMisVentas({ empresaId, usuarioId, tipoUsuarioId, fechaDesde, fechaHasta, estado, pagina = 1, limite = 20 }) {
  const esAdmin = tipoUsuarioId === 1 || tipoUsuarioId === 2

  const where = {
    empresa_id: empresaId,
    ...(!esAdmin && { usuario_id: usuarioId }),
    ...(estado && { estado }),
    ...(fechaDesde || fechaHasta ? {
      created_at: {
        ...(fechaDesde && { gte: new Date(fechaDesde) }),
        ...(fechaHasta && { lte: new Date(new Date(fechaHasta).setHours(23, 59, 59, 999)) }),
      },
    } : {}),
  }

  const skip = (pagina - 1) * limite

  const [ventas, total] = await Promise.all([
    db.ventas.findMany({
      where,
      skip,
      take: limite,
      orderBy: { created_at: "desc" },
      select: {
        id: true, total: true, subtotal: true, itbis: true,
        descuento: true, efectivo_recibido: true,
        estado: true, created_at: true,
        cliente:     { select: { nombre: true, cedula_rnc: true } },
        usuario:     { select: { nombre_completo: true } },
        metodo_pago: { select: { nombre: true } },
        comprobante: { select: { codigo: true, descripcion: true } },
        caja_sesion: { include: { caja: { select: { nombre: true } } } },
        venta_detalles: {
          select: {
            id: true, nombre_producto: true,
            cantidad: true, precio_unitario: true,
            itbis: true, descuento: true, subtotal: true,
          },
        },
      },
    }),
    db.ventas.count({ where }),
  ])

  return { ventas, total, paginas: Math.ceil(total / limite) }
}

export async function cancelarVenta(ventaId, empresaId) {
  const venta = await db.ventas.findFirst({
    where: { id: ventaId, empresa_id: empresaId },
    include: { venta_detalles: true },
  })

  if (!venta) throw new Error("Venta no encontrada")
  if (venta.estado === "cancelada") throw new Error("La venta ya está cancelada")

  return db.$transaction(async tx => {
    await tx.ventas.update({
      where: { id: ventaId },
      data: { estado: "cancelada" },
    })

    for (const d of venta.venta_detalles) {
      if (d.producto_id) {
        await tx.productos.update({
          where: { id: d.producto_id },
          data: { stock: { increment: d.cantidad } },
        })
      }
    }

    if (venta.caja_sesion_id) {
      await tx.cajas_sesiones.update({
        where: { id: venta.caja_sesion_id },
        data: { caja: { update: { saldo_actual: { decrement: venta.total } } } },
      })
    }

    return { ok: true }
  })
}