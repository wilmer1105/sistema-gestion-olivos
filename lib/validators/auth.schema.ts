// lib/validators/auth.schema.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email("Debe ingresar un correo electrónico válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

export type LoginInput = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email("Debe ingresar un correo electrónico válido"),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>