// lib/validators/admin.schema.ts
import { z } from 'zod'
import { empleadoSchema, ROLES_USUARIO_OFICIALES } from './usuario.schema'

export { empleadoSchema, ROLES_USUARIO_OFICIALES }

export const adminCreateUserSchema = z.object({
  nombres: z.string().min(2, 'Los nombres deben tener al menos 2 caracteres'),
  apellidos: z.string().min(2, 'Los apellidos deben tener al menos 2 caracteres'),
  dni: z.string().regex(/^\d{8}$/, 'El DNI debe tener exactamente 8 dígitos numéricos'),
  email: z.string().email('Debe ingresar un correo electrónico institucional válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(ROLES_USUARIO_OFICIALES, {
    message: 'Debe seleccionar un rol válido',
  }),
  area_id: z.string().nullable().optional(),
})

export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>
