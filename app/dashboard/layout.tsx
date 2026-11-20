// app/dashboard/layout.tsx
import { Sidebar } from '@/components/shared/Sidebar'
import { Navbar } from '@/components/shared/Navbar'
import { obtenerPerfilAutenticado } from '@/lib/auth/session'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const perfil = await obtenerPerfilAutenticado()

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <Sidebar perfil={perfil} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar perfil={perfil} />
        <main
          id="main-content"
          aria-label="Contenido principal del sistema"
          className="flex-1 overflow-y-auto p-6 md:p-8"
        >
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  )
}
