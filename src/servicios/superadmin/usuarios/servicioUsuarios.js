import db from "../../../_Db/db.js"
import bcrypt from "bcryptjs"

const SELECT_USUARIO = {
  id: true, nombre_completo: true, email: true, cedula: true,
  estado: true, created_at: true, updated_at: true,
  empresa_id: true, tipo_usuario_id: true,
  tipo_usuario:   { select: { id: true, nombre: true } },
  empresa:        { select: { id: true, nombre: true, estado: true } },
  usuario_modos:  { select: { modo_sistema: { select: { id: true, nombre: true } } } },
}

export async function listarUsuarios({ busqueda = "", estado = "", tipo = "", empresaId = "", pagina = 1, limite = 12 } = {}) {
  const where = {
    NOT: { tipo_usuario_id: 1 },
    ...(empresaId && { empresa_id: Number(empresaId) }),
    ...(busqueda && {
      OR: [
        { nombre_completo: { contains: busqueda } },
        { email:           { contains: busqueda } },
      ],
    }),
    ...(estado && { estado }),
    ...(tipo   && { tipo_usuario_id: Number(tipo) }),
  }

  const [total, usuarios] = await Promise.all([
    db.usuarios.count({ where }),
    db.usuarios.findMany({
      where,
      skip: (pagina - 1) * limite,
      take: limite,
      orderBy: { created_at: "desc" },
      select: {
        id: true, nombre_completo: true, email: true,
        estado: true, created_at: true,
        tipo_usuario:  { select: { id: true, nombre: true } },
        empresa:       { select: { id: true, nombre: true } },
        usuario_modos: { select: { modo_sistema: { select: { id: true, nombre: true } } } },
      },
    }),
  ])

  return { usuarios, total, paginas: Math.ceil(total / limite), pagina }
}

export async function obtenerUsuario(id) {
  return db.usuarios.findUnique({
    where: { id },
    select: SELECT_USUARIO,
  })
}

export async function crearUsuario(data) {
  const { nombre_completo, email, password, cedula, estado, empresa_id, tipo_usuario_id, modos_ids = [] } = data

  const existe = await db.usuarios.findUnique({ where: { email } })
  if (existe) throw new Error("Ya existe un usuario con ese email")

  const password_hash = await bcrypt.hash(password, 10)

  return db.usuarios.create({
    data: {
      nombre_completo,
      email,
      password_hash,
      cedula:          cedula || null,
      estado:          estado || "activo",
      empresa_id:      empresa_id      ? Number(empresa_id)      : null,
      tipo_usuario_id: Number(tipo_usuario_id),
      usuario_modos: {
        create: modos_ids.map(mid => ({ modo_sistema_id: Number(mid) })),
      },
    },
    select: SELECT_USUARIO,
  })
}

export async function actualizarUsuario(id, data) {
  const { nombre_completo, email, password, cedula, estado, empresa_id, tipo_usuario_id, modos_ids = [] } = data

  if (email) {
    const existe = await db.usuarios.findFirst({ where: { email, NOT: { id } } })
    if (existe) throw new Error("Ya existe un usuario con ese email")
  }

  const updateData = {
    ...(nombre_completo && { nombre_completo }),
    ...(email           && { email }),
    ...(cedula !== undefined && { cedula: cedula || null }),
    ...(estado          && { estado }),
    ...(tipo_usuario_id && { tipo_usuario_id: Number(tipo_usuario_id) }),
    empresa_id: empresa_id ? Number(empresa_id) : null,
    usuario_modos: {
      deleteMany: {},
      create: modos_ids.map(mid => ({ modo_sistema_id: Number(mid) })),
    },
  }

  if (password && password.trim() !== "") {
    updateData.password_hash = await bcrypt.hash(password, 10)
  }

  return db.usuarios.update({
    where: { id },
    data: updateData,
    select: SELECT_USUARIO,
  })
}

export async function eliminarUsuario(id) {
  await db.usuarios.delete({ where: { id } })
  return { ok: true }
}

export async function listarTiposUsuario() {
  return db.tipos_usuario.findMany({ orderBy: { id: "asc" } })
}

export async function listarModosSistema() {
  return db.modos_sistema.findMany({ orderBy: { id: "asc" } })
}