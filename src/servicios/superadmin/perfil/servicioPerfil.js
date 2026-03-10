import db from "../../../_Db/db.js"
import bcrypt from "bcryptjs"

export async function obtenerPerfil(id) {
  return db.usuarios.findUnique({
    where: { id },
    select: {
      id: true, nombre_completo: true, email: true, cedula: true,
      estado: true, created_at: true, updated_at: true,
      tipo_usuario: { select: { nombre: true } },
    },
  })
}

export async function actualizarPerfil(id, data) {
  const { nombre_completo, email, cedula } = data

  if (email) {
    const existe = await db.usuarios.findFirst({ where: { email, NOT: { id } } })
    if (existe) throw new Error("Ya existe un usuario con ese email")
  }

  return db.usuarios.update({
    where: { id },
    data: {
      ...(nombre_completo && { nombre_completo }),
      ...(email && { email }),
      cedula: cedula ?? null,
    },
    select: {
      id: true, nombre_completo: true, email: true, cedula: true,
      tipo_usuario: { select: { nombre: true } },
    },
  })
}

export async function cambiarPassword(id, { password_actual, password_nuevo }) {
  const usuario = await db.usuarios.findUnique({
    where: { id },
    select: { password_hash: true },
  })
  if (!usuario) throw new Error("Usuario no encontrado")

  const valido = await bcrypt.compare(password_actual, usuario.password_hash)
  if (!valido) throw new Error("La contraseña actual es incorrecta")

  const hash = await bcrypt.hash(password_nuevo, 10)
  await db.usuarios.update({ where: { id }, data: { password_hash: hash } })
  return { ok: true }
}