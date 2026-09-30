import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { DerivacionModal } from '@/components/modules/expedientes/DerivacionModal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Paperclip } from 'lucide-react'
import { PdfViewerModal } from '@/components/shared/PdfViewerModal'

export const dynamic = 'force-dynamic'

export default async function ExpedienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id: expedienteId } = await params

  // 1. Obtener datos del expediente, su área actual y archivos adjuntos
  const { data: expediente, error: expError } = await (supabase.from('expedientes') as any)
    .select('*, areas(nombre), adjuntos(id, nombre_archivo, ruta_almacenamiento, peso_bytes, tipo_mime)')
    .eq('id', expedienteId)
    .single()

  if (expError || !expediente) {
    notFound()
  }

  const adjuntos = Array.isArray(expediente.adjuntos) ? expediente.adjuntos : []

  // 2. Obtener lista de áreas (para el select del modal de derivación)
  const { data: areas } = await (supabase.from('areas') as any)
    .select('id, nombre, siglas')
    .order('nombre')

  // 3. Obtener el tracking (Hoja de ruta)
  const { data: trazabilidad } = await (supabase.from('trazabilidad') as any)
    .select(`
      *,
      area_origen:area_origen_id(nombre),
      area_destino:area_destino_id(nombre),
      emisor:emisor_id(nombres, apellidos)
    `)
    .eq('expediente_id', expedienteId)
    .order('fecha_envio', { ascending: false })

  return (
    <div className="space-y-6">
      
      {/* Cabecera y Acciones */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{expediente.cut}</h1>
            <Badge variant={expediente.estado === 'RECEPCIONADO' ? 'default' : 'secondary'}>
              {expediente.estado}
            </Badge>
          </div>
          <p className="text-slate-500">Ubicación actual: <span className="font-medium text-slate-700">{expediente.areas?.nombre}</span></p>
        </div>
        
        {/* Solo mostrar el botón de Derivar si el expediente está en estado RECEPCIONADO */}
        {expediente.estado === 'RECEPCIONADO' && (
          <DerivacionModal expedienteId={expedienteId} areas={areas || []} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Datos del Trámite */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg">Datos del Administrado</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Nombre / Razón Social</p>
                <p className="font-medium text-slate-900">{expediente.remitente_nombres}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">DNI / RUC</p>
                <p className="font-medium text-slate-900">{expediente.remitente_dni_ruc}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Correo Electrónico</p>
                <p className="text-slate-900">{expediente.correo || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Teléfono</p>
                <p className="text-slate-900">{expediente.telefono || '-'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg">Contenido del Expediente</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Asunto</p>
                <p className="text-slate-900 mt-1 p-3 bg-slate-50 rounded-md border">{expediente.asunto}</p>
              </div>
              <div className="flex gap-12">
                <div>
                  <p className="text-sm font-medium text-slate-500">Folios Adjuntos</p>
                  <p className="text-slate-900">{expediente.folios}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Fecha de Ingreso</p>
                  <p className="text-slate-900">
                    {format(new Date(expediente.fecha_creacion), "dd 'de' MMMM, yyyy - HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección: Archivos Adjuntos */}
          <Card className="shadow-sm">
            <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-slate-600" />
                <CardTitle className="text-lg">Archivos Adjuntos</CardTitle>
              </div>
              <Badge variant="secondary" className="font-normal text-xs">
                {adjuntos.length === 1 ? '1 Archivo adjunto' : `${adjuntos.length} Archivos adjuntos`}
              </Badge>
            </CardHeader>
            <CardContent className="pt-6">
              {adjuntos.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm">No se adjuntaron archivos para este expediente.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {adjuntos.map((adjunto: any) => (
                    <div
                      key={adjunto.id}
                      className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3 overflow-hidden min-w-0">
                        <div className="p-2 bg-primary/10 rounded-md shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="truncate min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate" title={adjunto.nombre_archivo}>
                            {adjunto.nombre_archivo}
                          </p>
                          <p className="text-xs text-slate-500">
                            {adjunto.peso_bytes
                              ? `${(adjunto.peso_bytes / 1024 / 1024).toFixed(2)} MB`
                              : adjunto.tipo_mime || 'Documento adjunto'}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <PdfViewerModal
                          url={adjunto.ruta_almacenamiento}
                          nombreArchivo={adjunto.nombre_archivo}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Línea de Tiempo (Hoja de Ruta) */}
        <div>
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
            Hoja de Ruta (Tracking)
          </h3>
          <div className="relative border-l border-slate-200 ml-3 space-y-6 pb-4">
            {trazabilidad?.map((item: any) => (
              <div key={item.id} className="relative pl-6">
                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-white" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900">
                    {item.accion}
                  </span>
                  <span className="text-xs text-slate-500 mb-1">
                    {format(new Date(item.fecha_envio), "dd MMM yyyy, HH:mm", { locale: es })}
                  </span>
                  <div className="bg-white border rounded-md p-3 mt-1 shadow-sm">
                    <p className="text-xs font-medium text-slate-700">De: {item.area_origen?.nombre}</p>
                    <p className="text-xs font-medium text-slate-700 mb-2">Hacia: {item.area_destino?.nombre}</p>
                    <p className="text-sm text-slate-600 italic">"{item.proveido}"</p>
                    <p className="text-[10px] text-slate-400 mt-2 text-right">
                      Por: {item.emisor?.nombres} {item.emisor?.apellidos}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
