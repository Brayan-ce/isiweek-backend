import db from "../../../_Db/db.js"

export async function listarEmpresas({ busqueda = "", estado = "", pagina = 1, limite = 12 } = {}) {
  const where = {
    ...(busqueda && { nombre: { contains: busqueda } }),
    ...(estado && { estado }),
  }
  const [total, empresas] = await Promise.all([
    db.empresas.count({ where }),
    db.empresas.findMany({
      where,
      skip: (pagina - 1) * limite,
      take: limite,
      orderBy: { created_at: "desc" },
      select: {
        id: true, nombre: true, rnc: true, razon_social: true,
        telefono: true, email: true,
        pais: true, estado_geo: true, ciudad: true,
        estado: true, created_at: true,
        moneda: { select: { id: true, nombre: true, simbolo: true, codigo: true } },
        _count: { select: { usuarios: true } },
      },
    }),
  ])
  return { empresas, total, paginas: Math.ceil(total / limite), pagina }
}

export async function obtenerEmpresa(id) {
  return db.empresas.findUnique({
    where: { id },
    include: {
      moneda: true,
      empresa_modulos: { include: { modulo: true } },
      _count: { select: { usuarios: true, ventas: true, productos: true, clientes: true } },
    },
  })
}

export async function crearEmpresa(data) {
  const { modulosIds = [], provincia, ...rest } = data
  return db.empresas.create({
    data: {
      ...rest,
      empresa_modulos: {
        create: modulosIds.map(modulo_id => ({ modulo_id, activo: true })),
      },
    },
    include: { moneda: true },
  })
}

export async function actualizarEmpresa(id, data) {
  const { modulosIds, provincia, ...rest } = data

  const empresa = await db.empresas.update({
    where: { id },
    data: rest,
    include: { moneda: true },
  })

  if (modulosIds !== undefined) {
    await db.empresa_modulos.deleteMany({ where: { empresa_id: id } })
    if (modulosIds.length > 0) {
      await db.empresa_modulos.createMany({
        data: modulosIds.map(modulo_id => ({ empresa_id: id, modulo_id, activo: true })),
      })
    }
  }

  return empresa
}

export async function eliminarEmpresa(id) {
  await db.empresas.delete({ where: { id } })
  return { ok: true }
}

export async function listarMonedas() {
  return db.monedas.findMany({ orderBy: { nombre: "asc" } })
}

export async function listarModulos() {
  return db.modulos.findMany({
    orderBy: { id: "asc" },
    include: { modo_sistema: true },
  })
}