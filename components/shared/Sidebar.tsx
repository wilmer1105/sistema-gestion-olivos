// components/shared/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Inbox, FilePlus2, Building2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/dashboard/bandeja', label: 'Mi Bandeja', icon: Inbox },
  { href: '/dashboard/expedientes/nuevo', label: 'Nuevo Expediente', icon: FilePlus2 },
  { href: '/dashboard/consulta', label: 'Consulta Pública', icon: Search },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-white flex-col hidden md:flex min-h-screen">
      <div className="h-16 flex items-center px-6 border-b">
        <Building2 className="h-6 w-6 text-primary mr-2" />
        <span className="font-bold text-slate-800 tracking-tight">MDLO Docs</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-5 w-5 mr-3", isActive ? "text-primary-foreground" : "text-slate-400")} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t">
        <p className="text-xs text-center text-slate-400">
          Versión 1.0.0 &copy; 2026
        </p>
      </div>
    </aside>
  )
}