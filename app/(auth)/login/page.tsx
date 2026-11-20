'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Building2, Loader2, ShieldAlert } from 'lucide-react'

import { loginAction } from '@/app/actions/auth'
import { loginSchema, type LoginInput } from '@/lib/validators/auth.schema'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Extraemos register y errors directamente de useForm
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  function onSubmit(data: LoginInput) {
    setErrorMsg(null)
    startTransition(async () => {
      const response = await loginAction(data)
      if (response && !response.success && response.error) {
        setErrorMsg(response.error)
      } else if (response?.redirectUrl) {
        window.location.href = response.redirectUrl
      }
    })
  }

  return (
    <main aria-label="Acceso institucional al sistema">
      <Card className="shadow-lg border-slate-200">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="bg-primary/10 p-3 rounded-full">
              <Building2 className="w-8 h-8 text-primary" aria-hidden="true" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Acceso Institucional</CardTitle>
          <CardDescription>
            Sistema de Gestión Documental - MDLO
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMsg && (
            <Alert
              role="alert"
              aria-live="assertive"
              variant="destructive"
              className="mb-6"
            >
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          {/* Usamos un form HTML nativo controlado por handleSubmit */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            aria-label="Formulario de inicio de sesión institucional"
            className="space-y-5"
          >
            
            <div className="space-y-2">
              <Label htmlFor="email" className={errors.email ? "text-destructive" : ""}>
                Correo Institucional
              </Label>
              <Input 
                id="email" 
                type="email" 
                autoComplete="email"
                placeholder="usuario@munilosolivos.gob.pe" 
                disabled={isPending} 
                aria-required="true"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "login-email-error" : undefined}
                {...register("email")} 
              />
              {errors.email && (
                <p id="login-email-error" role="alert" className="text-sm font-medium text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className={errors.password ? "text-destructive" : ""}>
                  Contraseña
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-sm"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                autoComplete="current-password"
                placeholder="••••••••" 
                disabled={isPending} 
                aria-required="true"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "login-password-error" : undefined}
                {...register("password")} 
              />
              {errors.password && (
                <p id="login-password-error" role="alert" className="text-sm font-medium text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isPending} aria-busy={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Verificando...</span>
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}