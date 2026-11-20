// lib/validators/usuario.schema.ts
import { z } from 'zod'

export const ROLES_USUARIO_OFICIALES = [
  'ADMIN_TI',
  'MESA_PARTES',
  'ASISTENTE_AREA',
  'ESPECIALISTA',
  'JEFE_AREA',
] as const

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const empleadoSchema = z
  .object({
    nombres: z
      .string()
      .trim()
      .min(2, 'Los nombres deben tener al menos 2 caracteres'),
    apellidos: z
      .string()
      .trim()
      .min(2, 'Los apellidos deben tener al menos 2 caracteres'),
    dni: z
      .string()
      .trim()
      .regex(/^\d{8}$/, 'El DNI debe tener exactamente 8 dígitos numéricos'),
    correo: z
      .string()
      .trim()
      .email('Debe ingresar un correo electrónico institucional válido')
      .optional(),
    email: z
      .string()
      .trim()
      .email('Debe ingresar un correo electrónico institucional válido')
      .optional(),
    password: z
      .string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres')
      .optional(),
    rol: z.enum(ROLES_USUARIO_OFICIALES, {
      message: 'Debe seleccionar un rol institucional válido',
    }),
    area_id: z.string().nullable().optional(),
    activo: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    const correoEfectivo = data.correo || data.email
    if (!correoEfectivo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['correo'],
        message: 'El correo electrónico institucional es obligatorio',
      })
    }

    if (data.rol === 'ADMIN_TI') {
      if (data.area_id !== null && data.area_id !== undefined && data.area_id !== '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['area_id'],
          message:
            'El rol ADMIN_TI es de alcance global y debe tener area_id = null',
        })
      }
    } else {
      const rawArea = data.area_id?.trim() || ''
      if (!rawArea || !UUID_REGEX.test(rawArea)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['area_id'],
          message:
            'Debe asignar una unidad orgánica válida (UUID) para este rol operativo',
        })
      }
    }
  })

export type EmpleadoInput = z.infer<typeof empleadoSchema>
