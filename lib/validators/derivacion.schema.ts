// lib/validators/derivacion.schema.ts
import { z } from 'zod'

export const derivacionSchema = z.object({
  area_destino_id: z.string().uuid("Debe seleccionar un área de destino válida"),
  proveido: z.string().min(5, "Debe indicar una instrucción o motivo (mínimo 5 caracteres)"),
})

export type DerivacionInput = z.infer<typeof derivacionSchema>