import db from "../../../_Db/db.js"

export async function obtenerDatosDashboard() {
  const [
    totalUsuarios,
    usuariosActivos,
    totalEmpresas,
    empresasActivas,
    solicitudesPendientes,
    totalSolicitudes,
    totalVentas,
    ultimasEmpresas,
    ultimasSolicitudes,
    ultimosUsuarios,
    ultimasVentas,
  ] = await Promise.all([
    db.usuarios.count(),
    db.usuarios.count({ where: { estado: "activo" } }),
    db.empresas.count(),
    db.empresas.count({ where: { estado: "activa" } }),
    db.solicitudes.count({ where: { estado: "pendiente" } }),
    db.solicitudes.count(),
    db.ventas.aggregate({ _sum: { total: true }, where: { estado: "completada" } }),
    db.empresas.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
      select: {
        id: true, nombre: true, estado: true, created_at: true,
        moneda: { select: { simbolo: true } },
      },
    }),
    db.solicitudes.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
      select: { id: true, nombre: true, email: true, estado: true, created_at: true },
    }),
    db.usuarios.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
      select: {
        id: true, nombre_completo: true, email: true, estado: true, created_at: true,
        tipo_usuario: { select: { nombre: true } },
        empresa: { select: { nombre: true } },
      },
    }),
    db.ventas.findMany({
      take: 6,
      orderBy: { created_at: "desc" },
      select: {
        id: true, total: true, estado: true, created_at: true,
        empresa: { select: { nombre: true } },
        usuario: { select: { nombre_completo: true } },
      },
    }),
  ])

  return {
    stats: {
      totalUsuarios,
      usuariosActivos,
      totalEmpresas,
      empresasActivas,
      solicitudesPendientes,
      totalSolicitudes,
      totalVentas: Number(totalVentas._sum.total ?? 0),
    },
    ultimasEmpresas,
    ultimasSolicitudes,
    ultimosUsuarios,
    ultimasVentas,
  }
}