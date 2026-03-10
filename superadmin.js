import { createRequire } from "module"
const require = createRequire(import.meta.url)
const bcrypt = require("bcryptjs")

import { PrismaClient } from "./src/generated/prisma/client/index.js"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"

const adapter = new PrismaMariaDb({
  host:            process.env.DB_HOST     ?? "127.0.0.1",
  port:            Number(process.env.DB_PORT ?? 3306),
  user:            process.env.DB_USER     ?? "root",
  password:        process.env.DB_PASSWORD ?? "123456",
  database:        process.env.DB_NAME     ?? "isiweek",
  connectionLimit: 3,
})

const db = new PrismaClient({ adapter })

const NOMBRE   = "Super Admin"
const EMAIL    = "admin@isiweek.com"
const PASSWORD = "Admin123!"

async function main() {
  const tipoSuperAdmin = await db.tipos_usuario.findFirst({
    where: { nombre: "Super Admin" },
  })

  if (!tipoSuperAdmin) {
    console.error("No se encontro el tipo_usuario 'Super Admin' en la base de datos.")
    process.exit(1)
  }

  const existe = await db.usuarios.findUnique({ where: { email: EMAIL } })

  if (existe) {
    console.log(`Ya existe un usuario con el correo ${EMAIL}`)
    process.exit(0)
  }

  const hash = await bcrypt.hash(PASSWORD, 12)

  const usuario = await db.usuarios.create({
    data: {
      nombre_completo: NOMBRE,
      email:           EMAIL,
      password_hash:   hash,
      tipo_usuario_id: tipoSuperAdmin.id,
      empresa_id:      null,
      modo_sistema_id: null,
      estado:          "activo",
    },
  })

  console.log("Super Admin creado exitosamente:")
  console.log("  ID     :", usuario.id)
  console.log("  Nombre :", usuario.nombre_completo)
  console.log("  Correo :", usuario.email)
  console.log("  Pass   :", PASSWORD)
}

main()
  .catch(e => { console.error(e.message); process.exit(1) })
  .finally(() => db.$disconnect())