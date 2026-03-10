import db from "../../../_Db/db.js"

export async function obtenerDatosHeader() {
  const [
    totalEmpresas,
    empresasActivas,
    totalUsuarios,
    usuariosActivos,
    totalSolicitudes,
    solicitudesPendientes,
    configRows,
  ] = await Promise.all([
    db.empresas.count(),
    db.empresas.count({ where: { estado: "activa" } }),
    db.usuarios.count(),
    db.usuarios.count({ where: { estado: "activo" } }),
    db.solicitudes.count(),
    db.solicitudes.count({ where: { estado: "pendiente" } }),
    db.sistema_config.findMany(),
  ])

  const config = {}
  for (const r of configRows) config[r.clave] = r.valor

  return {
    config,
    stats: {
      totalEmpresas,
      empresasActivas,
      totalUsuarios,
      usuariosActivos,
      totalSolicitudes,
      solicitudesPendientes,
    },
  }
}