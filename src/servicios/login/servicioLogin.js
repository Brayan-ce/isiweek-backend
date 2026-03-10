import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { OAuth2Client } from "google-auth-library"
import nodemailer from "nodemailer"
import db from "../../_Db/db.js"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
const GOOGLE_CLIENT = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

async function generarJWT(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(JWT_SECRET)
}

function rutaPorRol(tipo, modo) {
  if (tipo === "Super Admin") return "/superadmin/dashboard"
  if (modo === "OBRAS")       return "/obras/dashboard"
  return "/pos/"
}

const incluirRelaciones = {
  empresa: {
    select: {
      id: true,
      nombre: true,
      estado: true,
      moneda: { select: { simbolo: true, codigo: true } },
    },
  },
  tipo_usuario: { select: { id: true, nombre: true } },
  modo_sistema:  { select: { id: true, nombre: true } },
}

export async function loginEmail(email, password) {
  const usuario = await db.usuarios.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: incluirRelaciones,
  })

  if (!usuario) return { error: "Credenciales incorrectas", status: 401 }
  if (usuario.estado !== "activo") return { error: "Tu cuenta esta desactivada", status: 403 }
  if (usuario.empresa?.estado === "inactiva") return { error: "La empresa esta desactivada", status: 403 }

  const valido = await bcrypt.compare(password, usuario.password_hash)
  if (!valido) return { error: "Credenciales incorrectas", status: 401 }

  const tipo = usuario.tipo_usuario.nombre
  const modo = usuario.modo_sistema?.nombre ?? null
  const token = await generarJWT({ id: usuario.id, email: usuario.email, tipo, empresa_id: usuario.empresa_id, modo })

  return {
    ok: true,
    token,
    ruta: rutaPorRol(tipo, modo),
    usuario: {
      nombre: usuario.nombre_completo,
      tipo,
      modo,
      empresa: usuario.empresa?.nombre ?? null,
    },
  }
}

export async function loginGoogle(idToken) {
  const ticket = await GOOGLE_CLIENT.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  })

  const payload = ticket.getPayload()
  const email = payload.email?.toLowerCase()
  if (!email) return { error: "No se pudo obtener el email de Google", status: 400 }

  const usuario = await db.usuarios.findUnique({
    where: { email },
    include: incluirRelaciones,
  })

  if (!usuario) return { error: "No existe una cuenta con este email. Contacta al administrador.", status: 404 }
  if (usuario.estado !== "activo") return { error: "Tu cuenta esta desactivada", status: 403 }
  if (usuario.empresa?.estado === "inactiva") return { error: "La empresa esta desactivada", status: 403 }

  const tipo = usuario.tipo_usuario.nombre
  const modo = usuario.modo_sistema?.nombre ?? null
  const token = await generarJWT({ id: usuario.id, email: usuario.email, tipo, empresa_id: usuario.empresa_id, modo })

  return {
    ok: true,
    token,
    ruta: rutaPorRol(tipo, modo),
    usuario: {
      nombre: usuario.nombre_completo,
      tipo,
      modo,
      empresa: usuario.empresa?.nombre ?? null,
    },
  }
}

export async function enviarOTP(email) {
  email = email.toLowerCase().trim()

  const usuario = await db.usuarios.findUnique({
    where: { email },
    select: { id: true, estado: true },
  })

  if (!usuario) return { error: "No existe una cuenta con ese correo", status: 404 }
  if (usuario.estado !== "activo") return { error: "Tu cuenta esta desactivada", status: 403 }

  const codigo = Math.floor(100000 + Math.random() * 900000).toString()
  const expira = new Date(Date.now() + 10 * 60 * 1000)

  await db.otp_tokens.upsert({
    where: { email },
    update: { codigo, expira_at: expira, usado: false },
    create: { email, codigo, expira_at: expira, usado: false },
  })

  await mailer.sendMail({
    from: `"IsiWeek" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Tu codigo de verificacion IsiWeek",
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px">
        <h2 style="color:#1d6fce;margin-bottom:8px">IsiWeek</h2>
        <p style="color:#374151">Tu codigo de verificacion es:</p>
        <div style="font-size:38px;font-weight:800;letter-spacing:10px;color:#111827;margin:20px 0;text-align:center;background:white;padding:16px;border-radius:8px;border:1px solid #e2e8f0">${codigo}</div>
        <p style="color:#6b7280;font-size:13px">Expira en 10 minutos. No compartas este codigo.</p>
      </div>
    `,
  })

  return { ok: true }
}

export async function verificarOTP(email, codigo) {
  email = email.toLowerCase().trim()

  const registro = await db.otp_tokens.findUnique({ where: { email } })
  if (!registro) return { error: "Solicita un nuevo codigo", status: 400 }
  if (registro.usado) return { error: "Este codigo ya fue usado", status: 400 }
  if (new Date() > registro.expira_at) return { error: "El codigo expiro, solicita uno nuevo", status: 400 }
  if (registro.codigo !== codigo) return { error: "Codigo incorrecto", status: 400 }

  await db.otp_tokens.update({ where: { email }, data: { usado: true } })

  const usuario = await db.usuarios.findUnique({
    where: { email },
    include: incluirRelaciones,
  })

  if (!usuario || usuario.estado !== "activo") return { error: "Cuenta no disponible", status: 403 }

  const tipo = usuario.tipo_usuario.nombre
  const modo = usuario.modo_sistema?.nombre ?? null
  const token = await generarJWT({ id: usuario.id, email: usuario.email, tipo, empresa_id: usuario.empresa_id, modo })

  return {
    ok: true,
    token,
    ruta: rutaPorRol(tipo, modo),
    usuario: {
      nombre: usuario.nombre_completo,
      tipo,
      modo,
      empresa: usuario.empresa?.nombre ?? null,
    },
  }
}

export async function obtenerConfigSistema() {
  const registros = await db.sistema_config.findMany()
  const config = {}
  for (const r of registros) config[r.clave] = r.valor
  return config
}

export async function verificarToken(token) {
  const { payload } = await jwtVerify(token, JWT_SECRET)
  return payload
}