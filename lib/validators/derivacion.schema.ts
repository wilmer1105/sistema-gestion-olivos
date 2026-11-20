// lib/validators/derivacion.schema.ts
import { z } from 'zod'
import { TIPOS_DOCUMENTO_TRAMITE } from './expediente.schema'

export const derivacionSchema = z.object({
  expediente_id: z.string().uuid('El ID del expediente debe ser un UUID válido'),
  area_destino_id: z.string().uuid('Debe seleccionar un área de destino válida (UUID)'),
  proveido: z
    .string()
    .trim()
    .min(5, 'El proveído o instrucción debe tener al menos 5 caracteres'),
  asignado_a: z
    .string()
    .uuid('El especialista asignado debe tener un UUID válido')
    .optional()
    .nullable()
    .or(z.literal('')),
  accion: z.string().optional(),
  area_origen_id: z.string().optional(),
})

export type DerivacionInput = z.infer<typeof derivacionSchema>

export const asignacionInternaSchema = z.object({
  expediente_id: z.string().uuid('El ID del expediente debe ser un UUID válido'),
  especialista_id: z.string().uuid('Debe seleccionar un especialista válido (UUID)'),
  proveido: z
    .string()
    .trim()
    .refine((val) => !val || val.length >= 5, {
      message: 'El proveído de asignación debe tener al menos 5 caracteres',
    })
    .optional()
    .nullable(),
})

export type AsignacionInternaInput = z.infer<typeof asignacionInternaSchema>

export const cierreExpedienteSchema = z.object({
  expediente_id: z.string().uuid('El ID del expediente debe ser un UUID válido'),
  estado_final: z.enum(['ATENDIDO', 'ARCHIVADO'], {
    message: "El estado final solo puede ser 'ATENDIDO' o 'ARCHIVADO'",
  }),
  proveido: z
    .string()
    .trim()
    .min(5, 'El proveído de cierre debe tener al menos 5 caracteres'),
})

export type CierreExpedienteInput = z.infer<typeof cierreExpedienteSchema>

export const documentoIntermedioSchema = z.object({
  expediente_id: z.string().uuid('El ID del expediente debe ser un UUID válido'),
  tipo_documento: z.enum(TIPOS_DOCUMENTO_TRAMITE, {
    message: 'Debe seleccionar un tipo de documento válido',
  }),
  descripcion: z.string().trim().optional().nullable(),
})

export type DocumentoIntermedioInput = z.infer<typeof documentoIntermedioSchema>
