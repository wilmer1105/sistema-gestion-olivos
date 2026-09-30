// lib/validators/expediente.schema.ts
import { z } from 'zod'

export const expedienteSchema = z.object({
  remitente_nombres: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  remitente_dni_ruc: z.string().regex(/^[0-9]{8,11}$/, "Debe ser un DNI (8 dígitos) o RUC (11 dígitos) válido"),
  telefono: z.string().optional(),
  correo: z.string().email("Correo inválido").optional().or(z.literal('')),
  asunto: z.string().min(10, "El asunto debe ser claro y detallado (mínimo 10 caracteres)"),
  folios: z.coerce.number().min(1, "El expediente debe tener al menos 1 folio adjunto"),
})

export type ExpedienteInput = z.infer<typeof expedienteSchema>