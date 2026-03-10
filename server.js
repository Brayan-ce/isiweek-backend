import Fastify from "fastify"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import staticFiles from "@fastify/static"
import { fileURLToPath } from "url"
import path from "path"
import rutaLogin from "./src/rutas/login/rutaLogin.js"
import rutaHeader from "./src/rutas/superadmin/header/rutaHeader.js"
import rutaDashboard from "./src/rutas/superadmin/dashboard/rutaDashboard.js"
import rutaEmpresas from "./src/rutas/superadmin/empresas/rutaEmpresas.js"
import rutaUsuarios from "./src/rutas/superadmin/usuarios/rutaUsuarios.js"
import rutaSolicitudes from "./src/rutas/superadmin/solicitudes/rutaSolicitudes.js"
import rutaConfiguracion from "./src/rutas/superadmin/configuracion/rutaConfiguracion.js"
import rutaDepuracion from "./src/rutas/superadmin/depuracion/rutaDepuracion.js"
import rutaPerfil from "./src/rutas/superadmin/perfil/rutaPerfil.js"
import rutaPosHeader from "./src/rutas/pos/header/rutaHeader.js"
import rutaPosDashboard from "./src/rutas/pos/dashboard/rutaDashboard.js"
import { registrarPeticion, registrarError } from "./src/servicios/superadmin/depuracion/servicioDepuracion.js"
import rutaVender from "./src/rutas/pos/vender/rutaVender.js"
import rutaMisVentas from "./src/rutas/pos/misVentas/rutaMisVentas.js"
import rutaCajas from "./src/rutas/pos/cajas/rutaCajas.js"
import rutaProductos from "./src/rutas/pos/productos/rutaProductos.js"
import rutaCategorias from "./src/rutas/pos/categorias/rutaCategorias.js"
import rutaMarcas from "./src/rutas/pos/marcas/rutaMarcas.js"
import rutaCuotas from "./src/rutas/pos/cuotas/rutaCuotas.js"
import rutaCompras from "./src/rutas/pos/compras/rutaCompras.js"
import rutaProveedores from "./src/rutas/pos/proveedores/rutaProveedores.js"
import rutaClientes from "./src/rutas/pos/clientes/rutaClientes.js"
import rutaInventario from "./src/rutas/pos/inventario/rutaInventario.js"
import rutaGastos from "./src/rutas/pos/gastos/rutaGastos.js"
import rutaCotizaciones from "./src/rutas/pos/cotizaciones/rutaCotizaciones.js"
import rutaReportes from "./src/rutas/pos/reportes/rutaReportes.js"




const app = Fastify({
  logger: {
    level: "warn",
    transport: {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "SYS:standard", ignore: "pid,hostname" },
    },
  },
  disableRequestLogging: true,
})

await app.register(helmet, { contentSecurityPolicy: false })

await app.register(staticFiles, {
  root: path.join(path.dirname(fileURLToPath(import.meta.url)), "public"),
  prefix: "/",
  setHeaders: (res) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin")
    res.setHeader("Access-Control-Allow-Origin", "*")
  },
})

await app.register(cors, {
  origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
})

await app.register(rutaLogin,         { prefix: "/api/auth" })
await app.register(rutaHeader,        { prefix: "/api/superadmin/header" })
await app.register(rutaDashboard,     { prefix: "/api/superadmin/dashboard" })
await app.register(rutaEmpresas,      { prefix: "/api/superadmin/empresas" })
await app.register(rutaUsuarios,      { prefix: "/api/superadmin/usuarios" })
await app.register(rutaSolicitudes,   { prefix: "/api/superadmin/solicitudes" })
await app.register(rutaConfiguracion, { prefix: "/api/superadmin/configuracion" })
await app.register(rutaDepuracion,    { prefix: "/api/superadmin/depuracion" })
await app.register(rutaPerfil,        { prefix: "/api/superadmin/perfil" })
await app.register(rutaPosHeader,     { prefix: "/api/pos/header" })
await app.register(rutaPosDashboard,  { prefix: "/api/pos/dashboard" })
await app.register(rutaVender,        { prefix: "/api/pos/vender" })
await app.register(rutaMisVentas,     { prefix: "/api/pos/mis-ventas" })
await app.register(rutaCajas,         { prefix: "/api/pos/cajas" })
await app.register(rutaProductos,     { prefix: "/api/pos/productos" })
await app.register(rutaCategorias,    { prefix: "/api/pos/categorias" })
await app.register(rutaMarcas,        { prefix: "/api/pos/marcas" })
await app.register(rutaCuotas,        { prefix: "/api/pos/cuotas" })
await app.register(rutaCompras,       { prefix: "/api/pos/compras" })
await app.register(rutaProveedores,   { prefix: "/api/pos/proveedores" })
await app.register(rutaClientes, { prefix: "/api/pos/clientes" })
await app.register(rutaInventario, { prefix: "/api/pos/inventario" })
await app.register(rutaGastos, { prefix: "/api/pos/gastos" })
await app.register(rutaCotizaciones, { prefix: "/api/pos/cotizaciones" })
await app.register(rutaReportes, { prefix: "/api/pos/reportes" })



app.addHook("onResponse", (req, reply, done) => {
  if (!req.url.startsWith("/api/superadmin/depuracion")) {
    registrarPeticion(req, reply, reply.elapsedTime)
  }
  done()
})

app.addHook("onError", (req, reply, err, done) => {
  registrarError(err, req)
  done()
})

app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }))

try {
  await app.listen({ port: Number(process.env.PORT ?? 3001), host: "0.0.0.0" })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}