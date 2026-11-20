'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import {
  Building2,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  FileSearch,
  GitBranch,
  ArrowRight,
} from 'lucide-react'

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
    <main
      id="main-content"
      aria-label="Acceso institucional al sistema"
      className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#F4F6F9]"
    >
      {/* Panel izquierdo institucional (#0F2A4A) */}
      <section
        aria-label="Información institucional de SISGESDOC"
        className="order-2 lg:order-1 lg:col-span-6 xl:col-span-7 bg-[#0F2A4A] text-white flex flex-col justify-between p-6 sm:p-10 lg:p-16 border-t lg:border-t-0 lg:border-r border-slate-800"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-blue-600/25 border border-blue-400/40 shadow-sm shrink-0">
            <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
              Gobierno Digital Municipal
            </p>
            <p className="text-base sm:text-lg font-bold tracking-tight text-white">
              Municipalidad Distrital de Los Olivos
            </p>
          </div>
        </div>

        <div className="my-8 lg:my-0 max-w-xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-300/40 px-3.5 py-1 text-xs sm:text-sm font-semibold text-amber-200">
            <span>Plataforma Oficial SISGESDOC</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            SISGESDOC — Municipalidad Distrital de Los Olivos
          </h1>

          <p className="text-base sm:text-lg text-slate-100 leading-relaxed">
            Sistema Integral de Gestión Documental y Trámite de Expedientes con
            control jurisdiccional por unidad orgánica y trazabilidad auditable.
          </p>

          <ul className="space-y-4 pt-2" aria-label="Pilares del sistema institucional">
            <li className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-blue-700/60 border border-blue-400/30 shrink-0 mt-0.5">
                <GitBranch className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Trazabilidad inmutable
                </h2>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Hoja de ruta cronológica con registro auditable de cada recepción,
                  derivación, informe técnico y resolución.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-blue-700/60 border border-blue-400/30 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Seguridad por roles (RBAC)
                </h2>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Aislamiento estricto por unidad orgánica para Mesa de Partes,
                  Asistentes, Especialistas, Jefaturas y Administración TI.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-blue-700/60 border border-blue-400/30 shrink-0 mt-0.5">
                <FileSearch className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Transparencia ciudadana
                </h2>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Seguimiento público en línea mediante Código Único de Trámite
                  (CUT) con protección de datos personales.
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div className="pt-6 border-t border-slate-700/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-slate-200">
          <span>Oficina General de Tecnologías de la Información (OGTIC)</span>
          <span>Accesibilidad WCAG 2.1 AA · Ley N.° 29973</span>
        </div>
      </section>

      {/* Panel derecho: Tarjeta de acceso institucional */}
      <section
        aria-label="Formulario de autenticación"
        className="order-1 lg:order-2 lg:col-span-6 xl:col-span-5 flex flex-col items-center justify-center p-4 sm:p-10 lg:p-12"
      >
        <div className="w-full max-w-md space-y-6">
          <Card className="bg-white rounded-xl border border-slate-200 shadow-md">
            <CardHeader className="space-y-2 text-center pb-6 border-b border-slate-100">
              <div className="flex justify-center mb-2">
                <div className="bg-blue-700/10 p-3.5 rounded-xl border border-blue-700/20">
                  <Building2 className="w-8 h-8 text-blue-700" aria-hidden="true" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                Acceso Institucional
              </CardTitle>
              <CardDescription className="text-sm text-slate-600">
                Ingrese sus credenciales oficiales para acceder a su bandeja documental
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

              <form
                onSubmit={handleSubmit(onSubmit)}
                aria-label="Formulario de inicio de sesión institucional"
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className={`text-sm font-semibold ${
                      errors.email ? 'text-red-700' : 'text-slate-800'
                    }`}
                  >
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
                    aria-describedby={errors.email ? 'login-email-error' : undefined}
                    className="h-11 text-base bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p
                      id="login-email-error"
                      role="alert"
                      className="text-sm font-medium text-red-700"
                    >
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className={`text-sm font-semibold ${
                        errors.password ? 'text-red-700' : 'text-slate-800'
                      }`}
                    >
                      Contraseña
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-blue-700 hover:text-blue-800 hover:underline font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded-sm"
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
                    aria-describedby={errors.password ? 'login-password-error' : undefined}
                    className="h-11 text-base bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p
                      id="login-password-error"
                      role="alert"
                      className="text-sm font-medium text-red-700"
                    >
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold bg-blue-700 hover:bg-blue-800 text-white shadow-sm focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  disabled={isPending}
                  aria-busy={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-200 text-center">
                <p className="text-sm text-slate-700 mb-2.5">
                  ¿Es ciudadano y desea consultar el estado de su trámite?
                </p>
                <Link
                  href="/consulta"
                  className="inline-flex items-center justify-center gap-2 w-full h-11 px-4 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-sm font-semibold text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  <FileSearch className="w-4 h-4 text-blue-700" aria-hidden="true" />
                  <span>Ir al Portal de Consulta Ciudadana (CUT)</span>
                  <ArrowRight className="w-4 h-4 text-slate-700" aria-hidden="true" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}