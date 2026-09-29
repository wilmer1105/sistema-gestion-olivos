// app/page.tsx
import { redirect } from 'next/navigation'

export default function RootPage() {
  // Redirige automáticamente a la pantalla de acceso
  redirect('/login')
}