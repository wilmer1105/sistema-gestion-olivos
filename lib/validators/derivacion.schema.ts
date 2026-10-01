// lib/validators/derivacion.schema.ts
import { z } from 'zod'

export const derivacionSchema = z.object({
  area_destino_id: z.string().min(1, "Debe seleccionar un área de destino válida"),
  proveido: z.string().min(1, "Debe indicar una instrucción o motivo"),
  accion: z.string().optional(),
  area_origen_id: z.string().optional(),
  expediente_id: z.string().optional(),
})

export type DerivacionInput = z.infer<typeof derivacionSchema>