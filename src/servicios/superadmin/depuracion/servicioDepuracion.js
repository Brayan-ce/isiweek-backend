import db from "../../../_Db/db.js"

const TABLAS = [
  "empresas", "usuarios", "solicitudes", "productos", "clientes",
  "ventas", "compras", "cotizaciones", "pedidos", "obras",
  "trabajadores", "asistencias", "gastos", "gastos_obra",
  "categorias", "marcas", "cajas", "proveedores",
]

export async function obtenerEstadoBD() {
  const counts = await Promise.all(
    TABLAS.map(async tabla => {
      try {
        const total = await db[tabla].count()
        return { tabla, total }
      } catch {
        return { tabla, total: null, error: true }
      }
    })
  )
  return counts
}

export const logs = {
  errores: [],
  peticiones: [],
}

export function registrarError(err, req) {
  logs.errores.unshift({
    id: Date.now(),
    mensaje: err.message ?? String(err),
    stack: err.stack ?? null,
    url: req?.url ?? null,
    method: req?.method ?? null,
    timestamp: new Date().toISOString(),
  })
  if (logs.errores.length > 100) logs.errores.pop()
}

export function registrarPeticion(req, res, tiempo) {
  logs.peticiones.unshift({
    id: Date.now(),
    method: req.method,
    url: req.url,
    status: res.statusCode,
    tiempo,
    timestamp: new Date().toISOString(),
  })
  if (logs.peticiones.length > 200) logs.peticiones.pop()
}

export function obtenerLogs() {
  return {
    errores: logs.errores.slice(0, 50),
    peticiones: logs.peticiones.slice(0, 100),
  }
}

export function limpiarLogs() {
  logs.errores = []
  logs.peticiones = []
}