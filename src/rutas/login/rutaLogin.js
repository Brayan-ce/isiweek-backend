import {
  loginEmail,
  loginGoogle,
  enviarOTP,
  verificarOTP,
  obtenerConfigSistema,
} from "../../servicios/login/servicioLogin.js"

export default async function rutaLogin(app) {
  app.post("/login", async (req, reply) => {
    try {
      const { email, password } = req.body ?? {}
      if (!email || !password) return reply.status(400).send({ error: "Completa todos los campos" })
      const res = await loginEmail(email, password)
      if (res.error) return reply.status(res.status).send({ error: res.error })
      return reply.send(res)
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({ error: "Error interno del servidor" })
    }
  })

  app.post("/google", async (req, reply) => {
    try {
      const { idToken } = req.body ?? {}
      if (!idToken) return reply.status(400).send({ error: "Token de Google invalido" })
      const res = await loginGoogle(idToken)
      if (res.error) return reply.status(res.status).send({ error: res.error })
      return reply.send(res)
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({ error: "Error al verificar cuenta de Google" })
    }
  })

  app.post("/otp/enviar", async (req, reply) => {
    try {
      const { email } = req.body ?? {}
      if (!email) return reply.status(400).send({ error: "Ingresa tu correo" })
      const res = await enviarOTP(email)
      if (res.error) return reply.status(res.status).send({ error: res.error })
      return reply.send(res)
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({ error: "Error al enviar el codigo" })
    }
  })

  app.post("/otp/verificar", async (req, reply) => {
    try {
      const { email, codigo } = req.body ?? {}
      if (!email || !codigo) return reply.status(400).send({ error: "Completa todos los campos" })
      const res = await verificarOTP(email, codigo)
      if (res.error) return reply.status(res.status).send({ error: res.error })
      return reply.send(res)
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({ error: "Error interno del servidor" })
    }
  })

  app.get("/config", async (req, reply) => {
    try {
      const config = await obtenerConfigSistema()
      return reply.send(config)
    } catch (err) {
      req.log.error(err)
      return reply.status(500).send({ error: "Error al obtener configuracion" })
    }
  })

  app.post("/logout", async (req, reply) => {
    return reply.send({ ok: true })
  })
}