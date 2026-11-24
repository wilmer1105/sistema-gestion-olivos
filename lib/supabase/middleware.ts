// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'
import { obtenerRutaInicioPorRol, puedeAccederRuta } from '@/lib/domain/rbac'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const pathname = request.nextUrl.pathname
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/forgot-password')

  const hasSupabaseSessionCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-'))

  if (!hasSupabaseSessionCookie) {
    if (pathname.startsWith('/dashboard/consulta')) {
      const consultaUrl = request.nextUrl.clone()
      consultaUrl.pathname = '/consulta'
      return NextResponse.redirect(consultaUrl)
    }

    if (isDashboardRoute) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      return NextResponse.redirect(loginUrl)
    }

    return supabaseResponse
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirigir a consulta pública si intenta ir a la consulta del dashboard sin sesión
  if (pathname.startsWith('/dashboard/consulta') && !user) {
    const consultaUrl = request.nextUrl.clone()
    consultaUrl.pathname = '/consulta'
    return NextResponse.redirect(consultaUrl)
  }

  // Redirigir a login si intenta ir al dashboard sin autenticación
  if (isDashboardRoute && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Verificar baja lógica (activo === false) en rutas protegidas de /dashboard/* (RF-05, HU-01)
  if (isDashboardRoute && user) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('id, rol, area_id, activo')
      .eq('id', user.id)
      .maybeSingle()

    if (perfil && perfil.activo === false) {
      await supabase.auth.signOut()
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('error', 'cuenta_inactiva')
      return NextResponse.redirect(loginUrl)
    }

    // Autorización por rol a nivel de ruta (matriz RBAC centralizada en lib/domain/rbac.ts)
    if (perfil && !puedeAccederRuta(perfil, request.nextUrl.pathname)) {
      const destino = request.nextUrl.clone()
      destino.pathname = obtenerRutaInicioPorRol(perfil.rol)
      destino.search = ''
      return NextResponse.redirect(destino)
    }
  }

  // Redirigir al dashboard si ya está logueado e intenta ir al login
  if (isAuthRoute && user) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}
