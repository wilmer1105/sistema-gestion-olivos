// lib/validators/expediente.schema.ts
import { z } from 'zod'

export const TIPOS_DOC_REMITENTE = ['DNI', 'RUC', 'CE'] as const

export const TIPOS_DOCUMENTO_TRAMITE = [
  'FUT',
  'CARTA',
  'OFICIO',
  'SOLICITUD',
  'INFORME_TECNICO',
  'INFORME_LEGAL',
  'ACTA_FISCALIZACION',
  'RESOLUCION',
  'NOTIFICACION',
  'OTRO',
] as const

export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export interface ArchivoValidable {
  readonly name?: string
  readonly type: string
  readonly size: number
}

export interface ResultadoValidacionArchivo {
  readonly valido: boolean
  readonly error?: string
}

/**
 * Valida que un archivo sea estrictamente PDF ('application/pdf') y su peso sea > 0 y <= 10 MB (RF-07, RNF-05).
 */
export function validarArchivoPdf(
  file: ArchivoValidable | null | undefined
): ResultadoValidacionArchivo {
  if (!file) {
    return { valido: false, error: 'Debe proporcionar un archivo PDF válido.' }
  }

  if (file.type !== 'application/pdf') {
    return {
      valido: false,
      error: 'Solo se permiten archivos en formato PDF (application/pdf).',
    }
  }

  if (file.size <= 0) {
    return {
      valido: false,
      error: 'El archivo PDF está vacío (0 bytes).',
    }
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return {
      valido: false,
      error: 'El archivo PDF supera el límite máximo permitido de 10 MB.',
    }
  }

  return { valido: true }
}

export const expedienteSchema = z
  .object({
    tipo_doc_remitente: z.enum(TIPOS_DOC_REMITENTE).default('DNI'),
    remitente_dni_ruc: z
      .string()
      .trim()
      .min(8, 'El documento debe tener al menos 8 caracteres'),
    remitente_nombres: z
      .string()
      .trim()
      .min(3, 'El nombre o razón social debe tener al menos 3 caracteres'),
    telefono: z.string().trim().optional().nullable(),
    correo: z
      .string()
      .trim()
      .email('Correo electrónico inválido')
      .optional()
      .nullable()
      .or(z.literal('')),
    direccion: z.string().trim().optional().nullable(),
    tipo_tramite: z.enum(TIPOS_DOCUMENTO_TRAMITE).default('FUT'),
    asunto: z
      .string()
      .trim()
      .min(10, 'El asunto debe ser claro y detallado (mínimo 10 caracteres)'),
    folios: z.coerce
      .number()
      .int('El número de folios debe ser entero')
      .min(1, 'El expediente debe tener al menos 1 folio adjunto'),
    area_destino_inicial_id: z
      .string()
      .uuid('El área de destino inicial debe ser un UUID válido')
      .optional()
      .nullable()
      .or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    const doc = data.remitente_dni_ruc.trim()
    if (data.tipo_doc_remitente === 'DNI') {
      if (!/^\d{8}$/.test(doc)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['remitente_dni_ruc'],
          message: 'El DNI debe contener exactamente 8 dígitos numéricos',
        })
      }
    } else if (data.tipo_doc_remitente === 'RUC') {
      if (!/^\d{11}$/.test(doc)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['remitente_dni_ruc'],
          message: 'El RUC debe contener exactamente 11 dígitos numéricos',
        })
      }
    } else if (data.tipo_doc_remitente === 'CE') {
      if (!/^[A-Za-z0-9]{8,12}$/.test(doc)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['remitente_dni_ruc'],
          message:
            'El Carné de Extranjería (CE) debe tener entre 8 y 12 caracteres alfanuméricos',
        })
      }
    }
  })

export type ExpedienteInput = z.infer<typeof expedienteSchema>
