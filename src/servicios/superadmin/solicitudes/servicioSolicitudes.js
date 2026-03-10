import db from "../../../_Db/db.js"

export async function listarSolicitudes({ busqueda = "", estado = "", pagina = 1, limite = 12 } = {}) {
  const where = {
    ...(busqueda && {
      OR: [
        { nombre: { contains: busqueda } },
        { email: { contains: busqueda } },
      ],
    }),
    ...(estado && { estado }),
  }

  const [total, solicitudes] = await Promise.all([
    db.solicitudes.count({ where }),
    db.solicitudes.findMany({
      where,
      skip: (pagina - 1) * limite,
      take: limite,
      orderBy: { created_at: "desc" },
      select: {
        id: true, nombre: true, email: true, telefono: true,
        mensaje: true, estado: true, created_at: true,
        empresa: { select: { id: true, nombre: true } },
      },
    }),
  ])

  return { solicitudes, total, paginas: Math.ceil(total / limite), pagina }
}

export async function obtenerSolicitud(id) {
  return db.solicitudes.findUnique({
    where: { id },
    include: { empresa: true },
  })
}

export async function aprobarSolicitud(id) {
  const solicitud = await db.solicitudes.findUnique({ where: { id } })
  if (!solicitud) throw new Error("Solicitud no encontrada")

  return db.$transaction(async tx => {
    let empresa = null

    if (solicitud.empresa_id) {
      empresa = await tx.empresas.update({
        where: { id: solicitud.empresa_id },
        data: { estado: "activa" },
      })
    } else if (solicitud.nombre) {
      empresa = await tx.empresas.create({
        data: {
          nombre: solicitud.nombre,
          email: solicitud.email ?? null,
          telefono: solicitud.telefono ?? null,
          moneda_id: 1,
          estado: "activa",
        },
      })

      await tx.solicitudes.update({
        where: { id },
        data: { empresa_id: empresa.id },
      })
    }

    const sol = await tx.solicitudes.update({
      where: { id },
      data: { estado: "aprobada" },
    })

    return { solicitud: sol, empresa }
  })
}

export async function rechazarSolicitud(id) {
  const sol = await db.solicitudes.findUnique({ where: { id } })
  if (!sol) throw new Error("Solicitud no encontrada")

  if (sol.empresa_id) {
    await db.empresas.update({
      where: { id: sol.empresa_id },
      data: { estado: "inactiva" },
    })
  }

  return db.solicitudes.update({
    where: { id },
    data: { estado: "rechazada" },
  })
}

export async function pendienteSolicitud(id) {
  return db.solicitudes.update({
    where: { id },
    data: { estado: "pendiente" },
  })
}