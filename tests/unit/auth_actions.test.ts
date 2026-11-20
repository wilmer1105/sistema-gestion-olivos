// tests/unit/auth_actions.test.ts

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { loginAction } from '@/app/actions/auth'

// Mock de createClient de Supabase Server
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

describe('Server Action: loginAction (app/actions/auth.ts) - Simulación Anti-Falsos Positivos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rechaza datos de entrada inválidos antes de invocar la infraestructura de Supabase', async () => {
    const res = await loginAction({
      email: 'no-es-correo',
      password: '123',
    })

    expect(res.success).toBe(false)
    expect(res.error).toBe('Datos de acceso inválidos')
    expect(createClient).not.toHaveBeenCalled()
  })

  it('devuelve mensaje amigable ante fallo de credenciales de Supabase Auth sin exponer trazas internas', async () => {
    const mockSignInWithPassword = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials', status: 400 },
    })

    const mockSupabase = {
      auth: {
        signInWithPassword: mockSignInWithPassword,
      },
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>)

    const res = await loginAction({
      email: 'usuario.inexistente@mdlo.gob.pe',
      password: 'ClaveErronea123!',
    })

    expect(res.success).toBe(false)
    expect(res.error).toBe('Correo o contraseña incorrectos')
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'usuario.inexistente@mdlo.gob.pe',
      password: 'ClaveErronea123!',
    })
  })

  it('bloquea sesión y llama a signOut() cuando la cuenta está desactivada (activo === false)', async () => {
    const mockSignOut = vi.fn().mockResolvedValue({ error: null })
    const mockSignInWithPassword = vi.fn().mockResolvedValue({
      data: {
        user: { id: 'usr-inactivo-123', email: 'inactivo@mdlo.gob.pe' },
      },
      error: null,
    })

    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'usr-inactivo-123',
        rol: 'ESPECIALISTA',
        area_id: 'area-1',
        activo: false,
        nombres: 'Juan',
        apellidos: 'Inactivo',
      },
      error: null,
    })

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: mockSingle,
      }),
    })

    const mockSupabase = {
      auth: {
        signInWithPassword: mockSignInWithPassword,
        signOut: mockSignOut,
      },
      from: vi.fn().mockReturnValue({
        select: mockSelect,
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>)

    const res = await loginAction({
      email: 'inactivo@mdlo.gob.pe',
      password: 'PasswordValido123!',
    })

    expect(res.success).toBe(false)
    expect(res.error).toBe('Su cuenta se encuentra desactivada. Contacte a la OGTIC.')
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })

  it('bloquea sesión y llama a signOut() cuando el usuario no existe en la tabla perfiles', async () => {
    const mockSignOut = vi.fn().mockResolvedValue({ error: null })
    const mockSignInWithPassword = vi.fn().mockResolvedValue({
      data: {
        user: { id: 'usr-fantasma-456', email: 'fantasma@mdlo.gob.pe' },
      },
      error: null,
    })

    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Row not found', code: 'PGRST116' },
    })

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: mockSingle,
      }),
    })

    const mockSupabase = {
      auth: {
        signInWithPassword: mockSignInWithPassword,
        signOut: mockSignOut,
      },
      from: vi.fn().mockReturnValue({
        select: mockSelect,
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>)

    const res = await loginAction({
      email: 'fantasma@mdlo.gob.pe',
      password: 'PasswordValido123!',
    })

    expect(res.success).toBe(false)
    expect(res.error).toBe('El perfil institucional no existe en el sistema. Contacte a la OGTIC.')
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })

  it('retorna éxito y URL de redirección exacta /dashboard/admin para rol ADMIN_TI', async () => {
    const mockSignInWithPassword = vi.fn().mockResolvedValue({
      data: {
        user: { id: 'usr-admin-ti-789', email: 'admin@mdlo.gob.pe' },
      },
      error: null,
    })

    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'usr-admin-ti-789',
        rol: 'ADMIN_TI',
        area_id: null,
        activo: true,
        nombres: 'Admin',
        apellidos: 'OGTIC',
      },
      error: null,
    })

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: mockSingle,
      }),
    })

    const mockSupabase = {
      auth: {
        signInWithPassword: mockSignInWithPassword,
      },
      from: vi.fn().mockReturnValue({
        select: mockSelect,
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>)

    const res = await loginAction({
      email: 'admin@mdlo.gob.pe',
      password: 'PasswordValido123!',
    })

    expect(res.success).toBe(true)
    expect(res.redirectUrl).toBe('/dashboard/admin')
  })

  it('retorna éxito y URL de redirección /dashboard/bandeja para roles operativos (MESA_PARTES, JEFE_AREA)', async () => {
    const mockSignInWithPassword = vi.fn().mockResolvedValue({
      data: {
        user: { id: 'usr-jefe-999', email: 'jefe.obras@mdlo.gob.pe' },
      },
      error: null,
    })

    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'usr-jefe-999',
        rol: 'JEFE_AREA',
        area_id: 'area-sgopcu',
        activo: true,
        nombres: 'Jefe',
        apellidos: 'Obras',
      },
      error: null,
    })

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: mockSingle,
      }),
    })

    const mockSupabase = {
      auth: {
        signInWithPassword: mockSignInWithPassword,
      },
      from: vi.fn().mockReturnValue({
        select: mockSelect,
      }),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createClient>>)

    const res = await loginAction({
      email: 'jefe.obras@mdlo.gob.pe',
      password: 'PasswordValido123!',
    })

    expect(res.success).toBe(true)
    expect(res.redirectUrl).toBe('/dashboard/bandeja')
  })
})
