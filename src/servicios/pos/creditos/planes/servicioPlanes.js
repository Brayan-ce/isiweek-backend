import db from "../../../../_Db/db.js"

const SELECT_PLAN = {
  id: true, nombre: true, codigo: true, descripcion: true,
  mora_pct: true, dias_gracia: true,
  descuento_anticipado_pct: true, cuotas_minimas_anticipadas: true,
  monto_minimo: true, monto_maximo: true,
  requiere_fiador: true, permite_anticipado: true,
  activo: true, created_at: true,
  opciones: {
    select: { id: true, meses: true, tasa_anual_pct: true, inicial_pct: true, tipo: true },
    orderBy: { meses: "asc" },
  },
  _count: { select: { contratos: true } },
}

export async function getPlanes(empresaId) {
  return db.fin_planes.findMany({
    where: { empresa_id: empresaId },
    orderBy: { created_at: "desc" },
    select: SELECT_PLAN,
  })
}

export async function crearPlan(empresaId, data) {
  const { opciones = [], ...rest } = data
  if (!rest.nombre?.trim()) throw new Error("El nombre es obligatorio")

  return db.fin_planes.create({
    data: {
      empresa_id:                  empresaId,
      nombre:                      rest.nombre.trim(),
      codigo:                      rest.codigo?.trim() || null,
      descripcion:                 rest.descripcion?.trim() || null,
      mora_pct:                    Number(rest.mora_pct ?? 5),
      dias_gracia:                 Number(rest.dias_gracia ?? 5),
      descuento_anticipado_pct:    Number(rest.descuento_anticipado_pct ?? 0),
      cuotas_minimas_anticipadas:  Number(rest.cuotas_minimas_anticipadas ?? 0),
      monto_minimo:                Number(rest.monto_minimo ?? 0),
      monto_maximo:                rest.monto_maximo ? Number(rest.monto_maximo) : null,
      requiere_fiador:             rest.requiere_fiador ?? false,
      permite_anticipado:          rest.permite_anticipado ?? true,
      activo:                      rest.activo ?? true,
      opciones: {
        create: opciones.map(o => ({
          meses:          Number(o.meses),
          tasa_anual_pct: Number(o.tasa_anual_pct ?? 0),
          inicial_pct:    Number(o.inicial_pct ?? 0),
          tipo:           o.tipo ?? "credito",
        })),
      },
    },
    select: SELECT_PLAN,
  })
}

export async function editarPlan(id, data) {
  const { opciones = [], ...rest } = data
  if (!rest.nombre?.trim()) throw new Error("El nombre es obligatorio")

  await db.fin_plan_opciones.deleteMany({ where: { plan_id: Number(id) } })

  return db.fin_planes.update({
    where: { id: Number(id) },
    data: {
      nombre:                      rest.nombre.trim(),
      codigo:                      rest.codigo?.trim() || null,
      descripcion:                 rest.descripcion?.trim() || null,
      mora_pct:                    Number(rest.mora_pct ?? 5),
      dias_gracia:                 Number(rest.dias_gracia ?? 5),
      descuento_anticipado_pct:    Number(rest.descuento_anticipado_pct ?? 0),
      cuotas_minimas_anticipadas:  Number(rest.cuotas_minimas_anticipadas ?? 0),
      monto_minimo:                Number(rest.monto_minimo ?? 0),
      monto_maximo:                rest.monto_maximo ? Number(rest.monto_maximo) : null,
      requiere_fiador:             rest.requiere_fiador ?? false,
      permite_anticipado:          rest.permite_anticipado ?? true,
      activo:                      rest.activo ?? true,
      opciones: {
        create: opciones.map(o => ({
          meses:          Number(o.meses),
          tasa_anual_pct: Number(o.tasa_anual_pct ?? 0),
          inicial_pct:    Number(o.inicial_pct ?? 0),
          tipo:           o.tipo ?? "credito",
        })),
      },
    },
    select: SELECT_PLAN,
  })
}

export async function toggleActivoPlan(id, activo) {
  return db.fin_planes.update({
    where: { id: Number(id) },
    data: { activo },
    select: SELECT_PLAN,
  })
}

export async function eliminarPlan(id) {
  const plan = await db.fin_planes.findUnique({
    where: { id: Number(id) },
    select: { _count: { select: { contratos: true } } },
  })
  if (plan?._count?.contratos > 0)
    throw new Error("No se puede eliminar un plan con contratos asociados")
  await db.fin_planes.delete({ where: { id: Number(id) } })
  return { ok: true }
}