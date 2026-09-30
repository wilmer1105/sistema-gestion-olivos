import { Sidebar } from '@/components/shared/Sidebar'
import { Navbar } from '@/components/shared/Navbar'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userRole = 'FUNCIONARIO'
  if (user) {
    const { data: perfil } = await (supabase.from('perfiles') as any)
      .select('rol')
      .eq('id', user.id)
      .single()
    if (perfil?.rol) {
      userRole = perfil.rol
    } else if (user.user_metadata?.rol) {
      userRole = user.user_metadata.rol
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <Sidebar userRole={userRole} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        {/* El main contendrá las páginas internas (bandeja, resumen, nuevo expediente) */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}