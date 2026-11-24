// app/(auth)/forgot-password/page.tsx
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { KeyRound, Loader2, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react'

import { forgotPasswordAction } from '@/app/actions/auth'

import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg(null)
    setSuccess(false)

    if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError('Debe ingresar un correo electrónico válido')
      return
    }
    setEmailError(null)

    startTransition(async () => {
      const response = await forgotPasswordAction({ email: email.trim() })
      if (response?.error) {
        setErrorMsg(response.error)
      } else {
        setSuccess(true)
      }
    })
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      aria-label="Recuperación de contraseña institucional"
      className="flex min-h-screen items-center justify-center bg-[#F4F6F9] p-6"
    >
      <div className="w-full max-w-md">
        <Card className="bg-white rounded-xl shadow-md border border-slate-200">
          <CardHeader className="space-y-2 text-center pb-6 border-b border-slate-100">
            <div className="flex justify-center mb-2">
              <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200">
                <KeyRound className="w-8 h-8 text-blue-700" aria-hidden="true" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Recuperar Contraseña
              </h1>
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              Ingresa tu correo institucional registrado para recibir las instrucciones de recuperación.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {errorMsg && (
              <Alert
                role="alert"
                aria-live="assertive"
                variant="destructive"
                className="mb-6 border-red-300 bg-red-50 text-red-900"
              >
                <ShieldAlert className="h-5 w-5 text-red-700" aria-hidden="true" />
                <AlertDescription className="text-sm font-medium text-red-900">
                  {errorMsg}
                </AlertDescription>
              </Alert>
            )}

            {success ? (
              <div role="status" aria-live="polite" className="space-y-6 text-center py-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-slate-900">Solicitud enviada</h2>
                  <p className="text-base text-slate-700 leading-relaxed">
                    Si el correo ingresado corresponde a un usuario registrado en el sistema, recibirás un enlace seguro para restablecer tu contraseña.
                  </p>
                </div>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'w-full h-11 text-base font-semibold flex items-center justify-center gap-2 border-slate-300 text-slate-800'
                  )}
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Volver a Iniciar Sesión</span>
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                aria-label="Formulario de recuperación de contraseña"
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className={`text-sm font-semibold ${
                      emailError ? 'text-red-700' : 'text-slate-800'
                    }`}
                  >
                    Correo Institucional
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="usuario@munilosolivos.gob.pe"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (emailError) setEmailError(null)
                    }}
                    disabled={isPending}
                    aria-required="true"
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? 'forgot-email-error' : undefined}
                    className="h-11 text-base bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  />
                  {emailError && (
                    <p id="forgot-email-error" role="alert" className="text-sm font-medium text-red-700">
                      {emailError}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold bg-blue-700 hover:bg-blue-800 text-white"
                  disabled={isPending}
                  aria-busy={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                      <span>Enviando instrucciones...</span>
                    </>
                  ) : (
                    'Enviar Enlace de Recuperación'
                  )}
                </Button>

                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-sm"
                  >
                    <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    <span>Regresar al inicio de sesión</span>
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
