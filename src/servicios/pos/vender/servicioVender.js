import db from "../../../_Db/db.js"

export async function getProductos(empresaId, busqueda = "", pagina = 1, limite = 24) {
  const skip  = (pagina - 1) * limite
  const where = {
    empresa_id: empresaId,
    activo: true,
    ...(busqueda ? {
      OR: [
        { nombre:      { contains: busqueda } },
        { descripcion: { contains: busqueda } },
        { codigo:      { contains: busqueda } },
        { barcode:     { contains: busqueda } },
      ],
    } : {}),
  }

  const [productos, total] = await Promise.all([
    db.productos.findMany({
      where,
      skip,
      take: limite,
      orderBy: [{ stock: "desc" }, { nombre: "asc" }],
      select: {
        id: true, nombre: true, precio: true,
        stock: true, itbis_pct: true, imagen: true, codigo: true,
        categoria: { select: { nombre: true } },
        marca:     { select: { nombre: true } },
      },
    }),
    db.productos.count({ where }),
  ])

  return { productos, total, paginas: Math.ceil(total / limite) }
}

export async function getProductoPorCodigo(empresaId, codigo) {
  const prod = await db.productos.findFirst({
    where: {
      empresa_id: empresaId,
      activo: true,
      OR: [
        { codigo:  codigo },
        { barcode: codigo },
      ],
    },
    select: {
      id: true, nombre: true, precio: true,
      stock: true, itbis_pct: true,
      categoria: { select: { nombre: true } },
      marca:     { select: { nombre: true } },
    },
  })
  if (!prod) throw new Error("Producto no encontrado")
  return prod
}

export async function getDatosVender(empresaId, usuarioId) {
  const [clientes, comprobantes, metodosPago, cajaActiva, moneda] = await Promise.all([
    db.clientes.findMany({
      where: { empresa_id: empresaId },
      select: { id: true, nombre: true, cedula_rnc: true },
      orderBy: { nombre: "asc" },
    }),
    db.comprobantes.findMany({
      select: { id: true, codigo: true, descripcion: true },
    }),
    db.metodos_pago.findMany({
      select: { id: true, nombre: true },
    }),
    db.cajas_sesiones.findFirst({
      where: { usuario_id: usuarioId, estado: "abierta" },
      include: { caja: { select: { id: true, nombre: true, saldo_actual: true } } },
    }),
    db.empresas.findUnique({
      where: { id: empresaId },
      select: { moneda: { select: { simbolo: true, codigo: true } } },
    }),
  ])

  return {
    clientes,
    comprobantes,
    metodosPago,
    cajaActiva,
    moneda: moneda?.moneda ?? { simbolo: "RD$", codigo: "DOP" },
  }
}

export async function crearClienteRapido(empresaId, nombre) {
  if (!nombre?.trim()) throw new Error("El nombre es obligatorio")
  return db.clientes.create({
    data: { empresa_id: empresaId, nombre: nombre.trim() },
    select: { id: true, nombre: true, cedula_rnc: true },
  })
}

export async function actualizarStockProducto(empresaId, productoId, stock) {
  const prod = await db.productos.findFirst({
    where: { id: Number(productoId), empresa_id: Number(empresaId) },
    select: { id: true },
  })
  if (!prod) throw new Error("Producto no encontrado")
  return db.productos.update({
    where: { id: Number(productoId) },
    data:  { stock: Number(stock) },
    select: { id: true, stock: true },
  })
}

export async function getVentaRecibo(id) {
  const venta = await db.ventas.findUnique({
    where: { id: Number(id) },
    include: {
      empresa:        { select: { nombre: true, rnc: true, telefono: true, direccion: true, email: true, moneda: { select: { simbolo: true, codigo: true } } } },
      cliente:        { select: { nombre: true, cedula_rnc: true } },
      usuario:        { select: { nombre_completo: true } },
      metodo_pago:    { select: { nombre: true } },
      comprobante:    { select: { codigo: true, descripcion: true } },
      caja_sesion:    { include: { caja: { select: { nombre: true } } } },
      venta_detalles: true,
      venta_pagos:    { include: { metodo_pago: { select: { nombre: true } } } },
    },
  })
  if (!venta) throw new Error("Venta no encontrada")
  return venta
}

export async function crearVenta(empresaId, usuarioId, body) {
  const {
    cliente_id,
    comprobante_id,
    metodo_pago_id,
    pagos = [],
    caja_sesion_id,
    efectivo_recibido,
    descuento_global = 0,
    items,
  } = body

  if (!items?.length)   throw new Error("La venta no tiene productos")
  if (!caja_sesion_id)  throw new Error("No hay caja activa")

  const esMixto = pagos.length > 1

  if (esMixto) {
    if (!pagos.every(p => p.metodo_pago_id && Number(p.monto) > 0))
      throw new Error("Todos los pagos deben tener método y monto válido")
  } else {
    if (!metodo_pago_id) throw new Error("Selecciona un método de pago")
  }

  const ids   = items.map(i => i.producto_id)
  const prods = await db.productos.findMany({
    where: { id: { in: ids }, empresa_id: empresaId, activo: true },
    select: { id: true, nombre: true, precio: true, stock: true, itbis_pct: true },
  })

  const mapa = Object.fromEntries(prods.map(p => [p.id, p]))

  let subtotal = 0
  let itbis    = 0

  const detalles = items.map(item => {
    const prod = mapa[item.producto_id]
    if (!prod) throw new Error(`Producto ${item.producto_id} no existe`)
    if (prod.stock < item.cantidad) throw new Error(`Stock insuficiente para ${prod.nombre}`)

    const precioUnit = Number(prod.precio)
    const itbisPct   = Number(prod.itbis_pct) / 100
    const itbisItem  = precioUnit * itbisPct * item.cantidad
    const sub        = precioUnit * item.cantidad

    subtotal += sub
    itbis    += itbisItem

    return {
      producto_id:     prod.id,
      nombre_producto: prod.nombre,
      cantidad:        item.cantidad,
      precio_unitario: precioUnit,
      itbis:           itbisItem,
      descuento:       0,
      subtotal:        sub,
    }
  })

  const descuento = Number(descuento_global)
  const total     = subtotal + itbis - descuento

  if (esMixto) {
    const totalPagado = pagos.reduce((a, p) => a + Number(p.monto), 0)
    if (Math.abs(totalPagado - total) > 0.01)
      throw new Error(`El total pagado (${totalPagado.toFixed(2)}) no coincide con el total de la venta (${total.toFixed(2)})`)
  }

  const primerMetodo  = esMixto ? pagos[0].metodo_pago_id : metodo_pago_id
  const efectivoFinal = esMixto
    ? pagos.reduce((a, p) => a + Number(p.monto), 0)
    : Number(efectivo_recibido ?? total)

  const venta = await db.$transaction(async tx => {
    const v = await tx.ventas.create({
      data: {
        empresa_id:        empresaId,
        usuario_id:        usuarioId,
        cliente_id:        cliente_id     ?? null,
        caja_sesion_id,
        comprobante_id:    comprobante_id ?? null,
        metodo_pago_id:    primerMetodo,
        subtotal,
        itbis,
        descuento,
        total,
        efectivo_recibido: efectivoFinal,
        es_pago_mixto:     esMixto,
        estado:            "completada",
      },
    })

    await tx.venta_detalles.createMany({
      data: detalles.map(d => ({ ...d, venta_id: v.id })),
    })

    if (esMixto) {
      await tx.venta_pagos.createMany({
        data: pagos.map(p => ({
          venta_id:       v.id,
          metodo_pago_id: Number(p.metodo_pago_id),
          monto:          Number(p.monto),
        })),
      })
    }

    for (const item of items) {
      await tx.productos.update({
        where: { id: item.producto_id },
        data:  { stock: { decrement: item.cantidad } },
      })
    }

    await tx.cajas_sesiones.update({
      where: { id: caja_sesion_id },
      data:  { caja: { update: { saldo_actual: { increment: total } } } },
    })

    return tx.ventas.findUnique({
      where: { id: v.id },
      include: {
        cliente:        { select: { nombre: true, cedula_rnc: true } },
        usuario:        { select: { nombre_completo: true } },
        metodo_pago:    { select: { nombre: true } },
        comprobante:    { select: { codigo: true, descripcion: true } },
        caja_sesion:    { include: { caja: { select: { nombre: true } } } },
        venta_detalles: true,
        venta_pagos:    { include: { metodo_pago: { select: { nombre: true } } } },
      },
    })
  })

  return venta
}