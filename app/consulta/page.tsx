import { Building2 } from 'lucide-react'
import { ConsultaTracker } from '@/components/modules/consulta/ConsultaTracker'

export const dynamic = 'force-dynamic'

export default function ConsultaPublicaPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl space-y-8">
        
        {/* Cabecera Pública */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Consulta de Trámites
          </h1>
          <p className="text-slate-500">
            Municipalidad de Los Olivos - Sistema de Gestión Documental
          </p>
        </div>

        {/* Buscador y Seguimiento */}
        <ConsultaTracker
          cardTitle="Rastrear Expediente"
          cardDescription="Ingrese su Código Único de Trámite (CUT) para ver el estado actual."
        />

      </div>
    </div>
  )
}
