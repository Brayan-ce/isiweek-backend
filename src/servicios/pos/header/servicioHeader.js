import db from "../../../_Db/db.js"

const SLUG_MAP = {
  "creditos-dashboard":          "creditos/dashboard",
  "creditos-planes":             "creditos/planes",
  "creditos-contratos":          "creditos/contratos",
  "creditos-cuotas":             "creditos/cuotas",
  "creditos-pagos":              "creditos/pagos",
  "creditos-mora":               "creditos/mora",
  "ventas-online-pedidos":       "ventas-online/pedidos",
  "ventas-online-catalogo":      "ventas-online/catalogo",
  "ventas-online-configuracion": "ventas-online/configuracion",
}

export async function obtenerDatosHeader(usuarioId) {
  const usuario = await db.usuarios.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      nombre_completo: true,
      tipo_usuario_id: true,
      empresa: {
        select: {
          id: true,
          nombre: true,
          empresa_modulos: {
            where: { activo: true },
            select: { modulo_id: true },
          },
        },
      },
      usuario_modos: {
        select: {
          modo_sistema: {
            select: { id: true, nombre: true },
          },
        },
      },
    },
  })

  if (!usuario) throw new Error("Usuario no encontrado")

  const modulosEmpresa = new Set(
    usuario.empresa?.empresa_modulos.map(em => em.modulo_id) ?? []
  )

  const modulosTipo = await db.tipo_usuario_modulos.findMany({
    where: {
      tipo_usuario_id: usuario.tipo_usuario_id,
      puede_ver: true,
    },
    select: { modulo_id: true },
  })

  let idsPorEmpresaYTipo
  if (modulosTipo.length === 0) {
    idsPorEmpresaYTipo = [...modulosEmpresa]
  } else {
    const modulosTipoSet = new Set(modulosTipo.map(m => m.modulo_id))
    idsPorEmpresaYTipo = [...modulosEmpresa].filter(id => modulosTipoSet.has(id))
  }

  const modosDelUsuario = new Set(
    usuario.usuario_modos.map(um => um.modo_sistema.nombre)
  )

  const modulosBD = await db.modulos.findMany({
    where: {
      id: { in: idsPorEmpresaYTipo },
    },
    orderBy: { id: "asc" },
    select: {
      id: true,
      nombre: true,
      slug: true,
      modo_sistema: { select: { nombre: true } },
    },
  })

  const modulos = modulosBD
    .filter(m => {
      if (!m.modo_sistema) return true
      return modosDelUsuario.has(m.modo_sistema.nombre)
    })
    .map(m => ({ ...m, slug: SLUG_MAP[m.slug] ?? m.slug }))

  const config = await db.sistema_config.findMany({
    where: { clave: { in: ["sistema_nombre", "sistema_logo"] } },
  })
  const cfg = Object.fromEntries(config.map(c => [c.clave, c.valor]))

  return {
    usuario: {
      id: usuario.id,
      nombre_completo: usuario.nombre_completo,
    },
    empresa: {
      id: usuario.empresa?.id ?? null,
      nombre: usuario.empresa?.nombre ?? "",
    },
    modulos,
    sistema: {
      nombre: cfg.sistema_nombre ?? "IsiWeek",
      logo: cfg.sistema_logo ?? null,
    },
  }
}