// components/shared/Navbar.tsx
import { User, LogOut } from 'lucide-react'
import { logoutAction } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/server'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Obtenemos los datos del perfil y área desde la base de datos
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombres, apellidos, rol, areas(nombre)')
    .eq('id', user?.id || '')
    .single()

  // Convertimos el resultado a 'any' para evitar que TypeScript marque errores en las propiedades
  const perfilData = perfil as any

  const nombreCompleto = perfilData ? `${perfilData.nombres} ${perfilData.apellidos}` : 'Usuario Municipal'
  const nombreArea = perfilData?.areas?.nombre || 'Área no asignada'
  const rol = perfilData?.rol || 'Funcionario'

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-800">{nombreArea}</span>
        <span className="text-xs text-slate-500 uppercase tracking-wider">{rol}</span>
      </div>

      <DropdownMenu>
        {/* Quitamos asChild y pasamos las clases de diseño directamente al Trigger */}
        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-slate-200 bg-white hover:bg-slate-100 h-10 px-4 py-2 gap-2 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline-block">{nombreCompleto}</span>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <form action={logoutAction}>
            {/* Quitamos asChild y metemos el botón nativo dentro del DropdownMenuItem */}
            <DropdownMenuItem className="p-0">
              <button type="submit" className="w-full flex items-center cursor-pointer text-destructive px-2 py-1.5 focus:outline-none hover:bg-slate-100 rounded-sm">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </button>
            </DropdownMenuItem>
          </form>
          
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}