import { PrismaClient } from "../generated/prisma/client/index.js"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"

const adapter = new PrismaMariaDb({
  host:            process.env.DB_HOST     ?? "127.0.0.1",
  port:            Number(process.env.DB_PORT ?? 3306),
  user:            process.env.DB_USER     ?? "root",
  password:        process.env.DB_PASSWORD ?? "123456",
  database:        process.env.DB_NAME     ?? "isiweek",
  connectionLimit: 10,
})

const db = new PrismaClient({ adapter })
export default db