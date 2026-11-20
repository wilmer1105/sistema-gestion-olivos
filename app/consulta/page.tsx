import Link from 'next/link'
import { Building2, ArrowLeft, ShieldCheck } from 'lucide-react'
import { ConsultaTracker } from '@/components/modules/consulta/ConsultaTracker'

export const dynamic = 'force-dynamic'

export default function ConsultaPublicaPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
      {/* Cabecera Pública tipo Banner Institucional */}
      <header className="bg-[#0F2A4A] text-white border-b border-slate-800 shadow-sm">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-600/25 border border-blue-400/40 rounded-xl shrink-0">
              <Building2 className="w-7 h-7 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
                Municipalidad Distrital de Los Olivos · SISGESDOC
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Consulta de Trámites
              </h1>
              <p className="text-sm text-slate-600 sr-only">
                Portal público ciudadano de seguimiento documental
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F2A4A]"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Acceso Funcionarios</span>
            </Link>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        aria-label="Portal público de consulta de trámites"
        className="flex-1 flex flex-col items-center py-10 px-4 sm:px-6 lg:px-8"
      >
        <div className="w-full max-w-4xl space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-base text-slate-700">
              Consulte en línea el estado actual y la hoja de ruta de su expediente sin necesidad de clave.
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-full px-3 py-1 shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-700" aria-hidden="true" />
              <span>Datos protegidos</span>
            </span>
          </div>

          {/* Buscador y Seguimiento */}
          <ConsultaTracker
            cardTitle="Rastrear Expediente"
            cardDescription="Ingrese su Código Único de Trámite (CUT) para ver el estado actual."
          />
        </div>
      </main>
    </div>
  )
}

