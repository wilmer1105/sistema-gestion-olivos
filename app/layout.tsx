// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SISGESDOC | Sistema de Gestión Documental - Municipalidad de Los Olivos',
  description: 'Plataforma oficial de Gobierno Digital para el trámite y seguimiento de expedientes.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#F4F6F9] text-slate-900 text-base leading-relaxed antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-[#0F2A4A] focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          Saltar al contenido principal
        </a>
        {children}
      </body>
    </html>
  )
}