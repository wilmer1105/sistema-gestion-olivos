// app/(auth)/forgot-password/page.tsx
'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Building2, KeyRound, Loader2, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react'

import { forgotPasswordAction } from '@/app/actions/auth'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validators/auth.schema'

import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ForgotPasswordPage() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  function onSubmit(data: ForgotPasswordInput) {
    setErrorMsg(null)
    setSuccess(false)

    startTransition(async () => {
      const response = await forgotPasswordAction(data)
      if (response?.error) {
        setErrorMsg(response.error)
      } else {
        setSuccess(true)
      }
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="flex justify-center mb-2">
              <div className="bg-primary/10 p-3 rounded-full">
                <KeyRound className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Recuperar Contraseña</CardTitle>
            <CardDescription>
              Ingresa tu correo institucional registrado para recibir las instrucciones de recuperación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMsg && (
              <Alert variant="destructive" className="mb-6">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            {success ? (
              <div className="space-y-6 text-center py-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-800">Solicitud enviada</h3>
                  <p className="text-sm text-slate-600">
                    Si el correo ingresado corresponde a un usuario registrado en el sistema, recibirás un enlace seguro para restablecer tu contraseña.
                  </p>
                </div>
                <Link
                  href="/login"
                  className={cn(buttonVariants({ variant: "outline" }), "w-full flex items-center justify-center gap-2")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver a Iniciar Sesión
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className={errors.email ? "text-destructive" : ""}>
                    Correo Institucional
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@munilosolivos.gob.pe"
                    disabled={isPending}
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm font-medium text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando instrucciones...
                    </>
                  ) : (
                    'Enviar Enlace de Recuperación'
                  )}
                </Button>

                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Regresar al inicio de sesión
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
