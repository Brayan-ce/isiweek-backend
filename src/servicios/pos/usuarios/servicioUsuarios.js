import db from "../../../_Db/db.js"
import bcrypt from "bcryptjs"

const SELECT_USER = {
  id: true, nombre_completo: true, cedula: true,
  email: true, estado: true, created_at: true,
  tipo_usuario: { select: { id: true, nombre: true } },
  modo_sistema: { select: { id: true, nombre: true } },
}

export async function getUsuarios(empresaId) {
  return db.usuarios.findMany({
    where: { empresa_id: empresaId, tipo_usuario_id: { in: [2, 3] } },
    orderBy: { created_at: "desc" },
    select: SELECT_USER,
  })
}

export async function crearUsuario(empresaId, data) {
  if (!data.nombre_completo?.trim()) throw new Error("El nombre es obligatorio")
  if (!data.email?.trim())           throw new Error("El email es obligatorio")
  if (!data.password?.trim())        throw new Error("La contraseña es obligatoria")

  const existe = await db.usuarios.findUnique({ where: { email: data.email.trim() } })
  if (existe) throw new Error("Ya existe un usuario con ese email")

  const hash = await bcrypt.hash(data.password, 10)
  return db.usuarios.create({
    data: {
      empresa_id:      empresaId,
      tipo_usuario_id: Number(data.tipo_usuario_id ?? 3),
      modo_sistema_id: data.modo_sistema_id ? Number(data.modo_sistema_id) : null,
      nombre_completo: data.nombre_completo.trim(),
      cedula:          data.cedula?.trim() || null,
      email:           data.email.trim().toLowerCase(),
      password_hash:   hash,
      estado:          "activo",
    },
    select: SELECT_USER,
  })
}

export async function editarUsuario(id, data) {
  if (!data.nombre_completo?.trim()) throw new Error("El nombre es obligatorio")
  if (!data.email?.trim())           throw new Error("El email es obligatorio")

  const existe = await db.usuarios.findFirst({
    where: { email: data.email.trim(), NOT: { id: Number(id) } },
  })
  if (existe) throw new Error("Ya existe un usuario con ese email")

  return db.usuarios.update({
    where: { id: Number(id) },
    data: {
      tipo_usuario_id: Number(data.tipo_usuario_id ?? 3),
      modo_sistema_id: data.modo_sistema_id ? Number(data.modo_sistema_id) : null,
      nombre_completo: data.nombre_completo.trim(),
      cedula:          data.cedula?.trim() || null,
      email:           data.email.trim().toLowerCase(),
    },
    select: SELECT_USER,
  })
}

export async function toggleUsuario(id, estado) {
  return db.usuarios.update({
    where: { id: Number(id) },
    data: { estado },
    select: SELECT_USER,
  })
}

export async function resetPassword(id, password) {
  if (!password || password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres")
  const hash = await bcrypt.hash(password, 10)
  await db.usuarios.update({ where: { id: Number(id) }, data: { password_hash: hash } })
  return { ok: true }
}