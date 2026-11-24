// app/dashboard/expedientes/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { DerivacionModal } from '@/components/modules/expedientes/DerivacionModal'
import { FinalizarExpedienteModal } from '@/components/expedientes/FinalizarExpedienteModal'
import { SubirDocumentosDialog } from '@/components/modules/expedientes/SubirDocumentosDialog'
import {
  AsignarEspecialistaModal,
  type EspecialistaAreaOption,
} from '@/components/modules/expedientes/AsignarEspecialistaModal'
import { RecepcionarExpedienteBanner } from '@/components/modules/expedientes/RecepcionarExpedienteBanner'
import {
  puedeAsignarEspecialista,
  puedeDerivarExpediente,
  puedeFinalizarExpediente,
  puedeRecepcionarExpediente,
  puedeSubirDocumentoIntermedio,
  perteneceAlAreaActual,
  obtenerTiposDocumentoPermitidosPorRol,
} from '@/lib/domain/rbac'
import { obtenerPerfilAutenticado } from '@/lib/auth/session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Paperclip, Building2, UserCheck, AlertCircle } from 'lucide-react'
import { PdfViewerModal } from '@/components/shared/PdfViewerModal'
import { BackButton } from '@/components/shared/BackButton'
import type { TipoDocumentoTramite } from '@/types/database.types'

export const dynamic = 'force-dynamic'

interface AdjuntoVistaItem {
  id: string
  expediente_id: string | null
  nombre_archivo: string
  ruta_almacenamiento: string
  tipo_documento: TipoDocumentoTramite
  tipo_mime: string | null
  peso_bytes: number | null
  subido_por: string | null
  fecha_subida: string
  area_id: string | null
  areaNombre: string
}

export default async function ExpedienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: expedienteId } = await params
  const perfil = await obtenerPerfilAutenticado()

  if (perfil.rol === 'ADMIN_TI') {
    redirect('/dashboard/admin')
  }

  const supabase = await createClient()
  const rolUsuario = perfil.rol
  const areaUsuarioId = perfil.area_id
  const usuarioActivo = perfil.activo

  const { data: expedienteRaw, error: expError } = await supabase
    .from('expedientes')
    .select(
      '*, areas:area_actual_id(id, nombre, siglas), especialista:asignado_a(id, nombres, apellidos), adjuntos(*, areas(id, nombre, siglas))'
    )
    .eq('id', expedienteId)
    .single()

  if (expError || !expedienteRaw) {
    notFound()
  }

  const areaActualObj = Array.isArray(expedienteRaw.areas)
    ? expedienteRaw.areas[0]
    : expedienteRaw.areas
  const especialistaAsignadoObj = Array.isArray(expedienteRaw.especialista)
    ? expedienteRaw.especialista[0]
    : expedienteRaw.especialista

  const adjuntosRaw = Array.isArray(expedienteRaw.adjuntos)
    ? expedienteRaw.adjuntos
    : []

  const adjuntos: AdjuntoVistaItem[] = adjuntosRaw.map((adj) => {
    const areaAdjObj = Array.isArray(adj.areas) ? adj.areas[0] : adj.areas
    return {
      id: adj.id,
      expediente_id: adj.expediente_id,
      nombre_archivo: adj.nombre_archivo,
      ruta_almacenamiento: adj.ruta_almacenamiento,
      tipo_documento: adj.tipo_documento,
      tipo_mime: adj.tipo_mime,
      peso_bytes: adj.peso_bytes,
      subido_por: adj.subido_por,
      fecha_subida: adj.fecha_subida,
      area_id: adj.area_id,
      areaNombre:
        areaAdjObj?.nombre ||
        'Oficina de Atención al Ciudadano y Gestión Documental (Mesa de Partes)',
    }
  })

  const adjuntosPorArea: Record<string, AdjuntoVistaItem[]> = {}
  for (const adj of adjuntos) {
    if (!adjuntosPorArea[adj.areaNombre]) {
      adjuntosPorArea[adj.areaNombre] = []
    }
    adjuntosPorArea[adj.areaNombre].push(adj)
  }

  const { data: areas } = await supabase
    .from('areas')
    .select('id, nombre, siglas')
    .order('nombre')

  let especialistasArea: EspecialistaAreaOption[] = []
  if (
    areaUsuarioId &&
    (rolUsuario === 'ASISTENTE_AREA' || rolUsuario === 'JEFE_AREA')
  ) {
    const { data: espRows } = await supabase
      .from('perfiles')
      .select('id, nombres, apellidos, rol')
      .eq('area_id', areaUsuarioId)
      .eq('activo', true)
      .in('rol', ['ESPECIALISTA', 'JEFE_AREA'])
      .order('nombres')

    especialistasArea = (espRows || []).map((e) => ({
      id: e.id,
      nombres: e.nombres,
      apellidos: e.apellidos,
      rol: e.rol,
    }))
  }

  const { data: trazabilidadRaw } = await supabase
    .from('trazabilidad')
    .select(
      `
      *,
      area_origen:area_origen_id(nombre),
      area_destino:area_destino_id(nombre),
      emisor:emisor_id(nombres, apellidos)
    `
    )
    .eq('expediente_id', expedienteId)
    .order('fecha_envio', { ascending: false })

  const perfilContext = {
    id: perfil.id,
    rol: rolUsuario,
    area_id: areaUsuarioId,
    activo: usuarioActivo,
  }

  const expedienteContext = {
    id: expedienteRaw.id,
    area_actual_id: expedienteRaw.area_actual_id,
    estado: expedienteRaw.estado,
    asignado_a: expedienteRaw.asignado_a,
  }

  const esMismaArea = perteneceAlAreaActual(perfilContext, expedienteContext)
  const estaEnEstadoDerivadoSinRecepcionar =
    expedienteRaw.estado === 'DERIVADO'
  const estaCerrado =
    expedienteRaw.estado === 'ATENDIDO' ||
    expedienteRaw.estado === 'ARCHIVADO'

  const permisoRecepcionar = puedeRecepcionarExpediente(
    perfilContext,
    expedienteContext
  )
  const permisoAsignar = puedeAsignarEspecialista(
    perfilContext,
    expedienteContext
  )
  const permisoSubirDoc = puedeSubirDocumentoIntermedio(
    perfilContext,
    expedienteContext
  )
  const canDerivar = puedeDerivarExpediente(
    perfilContext,
    expedienteContext
  )
  const permisoFinalizar = puedeFinalizarExpediente(
    perfilContext,
    expedienteContext
  )

  return (
    <div className="space-y-6">
      <div>
        <BackButton
          fallbackUrl="/dashboard/bandeja"
          label="Volver a la bandeja"
        />
      </div>

      {/* Banner de Modo Solo Lectura para usuarios de otras áreas */}
      {!esMismaArea && (
        <div
          role="status"
          className="p-4 bg-amber-50 text-amber-900 rounded-md border border-amber-300 flex items-center gap-3 shadow-sm"
        >
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" aria-hidden="true" />
          <p className="text-sm">
            <strong>Modo solo lectura:</strong> Este expediente se encuentra asignado al área{' '}
            <span className="font-semibold">
              {areaActualObj?.nombre || 'otra unidad orgánica'}
              {areaActualObj?.siglas ? ` (${areaActualObj.siglas})` : ''}
            </span>
            . Su usuario no pertenece a dicha unidad y no puede ejecutar acciones operativas.
          </p>
        </div>
      )}

      {/* Control de Estado No Recepcionado (HU-05 Escenario 2) */}
      {estaEnEstadoDerivadoSinRecepcionar && esMismaArea && (
        <RecepcionarExpedienteBanner
          expedienteId={expedienteId}
          cut={expedienteRaw.cut}
          puedeRecepcionar={permisoRecepcionar}
        />
      )}

      {/* Cabecera destacada con CUT, estado y botonera de acciones */}
      <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-[#0F2A4A] p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
            Ficha Integral de Expediente Administrativo
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-slate-900">
              {expedienteRaw.cut}
            </h1>
            <Badge className="inline-flex items-center gap-1.5 rounded-full bg-[#0F2A4A] text-white border border-slate-800 px-3.5 py-1 text-xs font-bold">
              <span>{expedienteRaw.estado}</span>
            </Badge>
          </div>
          <p className="text-base text-slate-700">
            Ubicación actual:{' '}
            <span className="font-bold text-slate-900">
              {areaActualObj?.nombre || 'Mesa de Partes'}
            </span>
          </p>
          {especialistaAsignadoObj && (
            <p className="text-sm text-indigo-800 font-semibold mt-1 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-700" aria-hidden="true" />
              <span>
                Especialista asignado: {especialistaAsignadoObj.nombres}{' '}
                {especialistaAsignadoObj.apellidos}
              </span>
            </p>
          )}
        </div>

        {!estaCerrado && esMismaArea && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Asignación Interna (RF-12): ASISTENTE_AREA o JEFE_AREA */}
            {(rolUsuario === 'ASISTENTE_AREA' ||
              rolUsuario === 'JEFE_AREA') && (
              <AsignarEspecialistaModal
                expedienteId={expedienteId}
                especialistas={especialistasArea}
                asignadoActualId={expedienteRaw.asignado_a}
                disabled={
                  estaEnEstadoDerivadoSinRecepcionar || !permisoAsignar
                }
              />
            )}

            {/* Derivación Segura (RF-15, HU-07) */}
            <DerivacionModal
              expedienteId={expedienteId}
              areaOrigenId={expedienteRaw.area_actual_id}
              areas={areas || []}
              disabled={estaEnEstadoDerivadoSinRecepcionar || !canDerivar}
            />

            {/* Cierre Exclusivo por Jefatura (RF-16, HU-08): Solo se renderiza en el DOM si perfil.rol === 'JEFE_AREA' */}
            {rolUsuario === 'JEFE_AREA' && (
              <FinalizarExpedienteModal
                expedienteId={expedienteId}
                cut={expedienteRaw.cut}
                disabled={
                  estaEnEstadoDerivadoSinRecepcionar || !permisoFinalizar
                }
              />
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white rounded-xl border border-slate-200 shadow-xs">
            <CardHeader className="bg-slate-50/80 border-b border-slate-200">
              <CardTitle className="text-lg font-bold text-slate-900">
                <h2>Datos del Administrado</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <p className="text-sm font-semibold text-slate-600">
                  Nombre / Razón Social
                </p>
                <p className="text-base font-bold text-slate-900 mt-0.5">
                  {expedienteRaw.remitente_nombres}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">
                  {expedienteRaw.tipo_doc_remitente || 'DNI / RUC'}
                </p>
                <p className="text-base font-bold font-mono text-slate-900 mt-0.5">
                  {expedienteRaw.remitente_dni_ruc}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">
                  Correo Electrónico
                </p>
                <p className="text-base text-slate-900 mt-0.5">
                  {expedienteRaw.correo || '—'}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Teléfono</p>
                <p className="text-base text-slate-900 mt-0.5">
                  {expedienteRaw.telefono || '—'}
                </p>
              </div>
              {expedienteRaw.direccion && (
                <div className="sm:col-span-2">
                  <p className="text-sm font-semibold text-slate-600">
                    Dirección Domiciliaria / Fiscal
                  </p>
                  <p className="text-base text-slate-900 mt-0.5">
                    {expedienteRaw.direccion}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl border border-slate-200 shadow-xs">
            <CardHeader className="bg-slate-50/80 border-b border-slate-200">
              <CardTitle className="text-lg font-bold text-slate-900">
                <h2>Contenido del Expediente</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div>
                <p className="text-sm font-semibold text-slate-600">Asunto</p>
                <p className="text-base text-slate-900 mt-1.5 p-4 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed">
                  {expedienteRaw.asunto}
                </p>
              </div>
              <div className="flex flex-wrap gap-8">
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    Tipo de Trámite
                  </p>
                  <p className="text-base text-slate-900 font-bold mt-0.5">
                    {expedienteRaw.tipo_tramite}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    Folios Adjuntos
                  </p>
                  <p className="text-base font-mono font-bold text-slate-900 mt-0.5">
                    {expedienteRaw.folios}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    Fecha de Ingreso
                  </p>
                  <p className="text-base text-slate-900 font-medium mt-0.5">
                    {format(
                      new Date(expedienteRaw.fecha_creacion),
                      "dd 'de' MMMM, yyyy - HH:mm",
                      { locale: es }
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección: Archivos Adjuntos Agrupados por Unidad Orgánica Emisora (RF-13, RF-14, HU-06) */}
          <Card className="bg-white rounded-xl border border-slate-200 shadow-xs">
            <CardHeader className="bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
              <div className="flex items-center gap-2.5">
                <Paperclip
                  className="w-5 h-5 text-blue-700"
                  aria-hidden="true"
                />
                <CardTitle className="text-lg font-bold text-slate-900">
                  <h2>Archivos Adjuntos</h2>
                </CardTitle>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Badge
                  variant="secondary"
                  className="rounded-full bg-slate-200 text-slate-900 font-bold text-xs px-3 py-1"
                >
                  {adjuntos.length === 1
                    ? '1 Archivo adjunto'
                    : `${adjuntos.length} Archivos adjuntos`}
                </Badge>

                {(rolUsuario === 'ASISTENTE_AREA' ||
                  rolUsuario === 'ESPECIALISTA' ||
                  rolUsuario === 'JEFE_AREA') &&
                  !estaCerrado &&
                  esMismaArea && (
                    <SubirDocumentosDialog
                      expedienteId={expedienteId}
                      disabled={
                        estaEnEstadoDerivadoSinRecepcionar || !permisoSubirDoc
                      }
                      tiposPermitidos={obtenerTiposDocumentoPermitidosPorRol(rolUsuario)}
                    />
                  )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {adjuntos.length === 0 ? (
                <div className="text-center py-8 text-slate-700">
                  <FileText
                    className="w-10 h-10 mx-auto text-slate-600 mb-2"
                    aria-hidden="true"
                  />
                  <p className="text-base font-medium">
                    No se adjuntaron archivos para este expediente.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(adjuntosPorArea).map(
                    ([areaNombre, listaAdjuntos]) => (
                      <div key={areaNombre} className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <div className="flex items-center gap-2">
                            <Building2
                              className="w-4 h-4 text-blue-700"
                              aria-hidden="true"
                            />
                            <h3 className="text-sm font-bold text-slate-900">
                              Documentos emitidos por: {areaNombre}
                            </h3>
                          </div>
                          <Badge
                            variant="outline"
                            className="rounded-full text-xs font-semibold border-slate-300 text-slate-800"
                          >
                            {listaAdjuntos.length}{' '}
                            {listaAdjuntos.length === 1
                              ? 'archivo'
                              : 'archivos'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {listaAdjuntos.map((adjunto) => (
                            <div
                              key={adjunto.id}
                              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 transition-colors gap-3"
                            >
                              <div className="flex items-center gap-3 overflow-hidden min-w-0">
                                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg shrink-0">
                                  <FileText
                                    className="w-4 h-4 text-blue-700"
                                    aria-hidden="true"
                                  />
                                </div>
                                <div className="truncate min-w-0">
                                  <p className="text-sm font-bold text-slate-900 truncate">
                                    {adjunto.nombre_archivo}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                      variant="outline"
                                      className="text-xs px-2 py-0 font-bold text-slate-800 border-slate-300 bg-white"
                                    >
                                      {adjunto.tipo_documento}
                                    </Badge>
                                    <span className="text-xs font-medium text-slate-700">
                                      {adjunto.peso_bytes
                                        ? `${(
                                            adjunto.peso_bytes /
                                            1024 /
                                            1024
                                          ).toFixed(2)} MB`
                                        : adjunto.tipo_mime || 'PDF'}
                                    </span>
                                  </div>
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
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Línea de Tiempo (Hoja de Ruta) */}
        <section
          aria-label="Hoja de Ruta del expediente"
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs h-fit"
        >
          <h2 className="text-lg font-bold text-slate-900 mb-5 pb-3 border-b border-slate-200 flex items-center">
            Hoja de Ruta (Tracking)
          </h2>
          {!trazabilidadRaw || trazabilidadRaw.length === 0 ? (
            <p className="text-base text-slate-700 italic">
              No hay movimientos registrados para este expediente aún.
            </p>
          ) : (
            <ol
              aria-label="Movimientos registrados en la hoja de ruta"
              className="relative border-l-2 border-blue-200 ml-3 space-y-6 pb-2 list-none"
            >
              {trazabilidadRaw.map((item, idx) => {
                let formattedFecha = 'Fecha no registrada'
                if (item.fecha_envio) {
                  try {
                    const d = new Date(item.fecha_envio)
                    if (!isNaN(d.getTime())) {
                      formattedFecha = format(d, 'dd MMM yyyy, HH:mm', {
                        locale: es,
                      })
                    }
                  } catch {
                    formattedFecha = 'Fecha no disponible'
                  }
                }

                const areaOrigenObj = Array.isArray(item.area_origen)
                  ? item.area_origen[0]
                  : item.area_origen
                const areaDestinoObj = Array.isArray(item.area_destino)
                  ? item.area_destino[0]
                  : item.area_destino
                const emisorObj = Array.isArray(item.emisor)
                  ? item.emisor[0]
                  : item.emisor

                const emisorNombre = emisorObj
                  ? `${emisorObj.nombres || ''} ${
                      emisorObj.apellidos || ''
                    }`.trim()
                  : ''

                return (
                  <li key={item.id} className="relative pl-7">
                    <div
                      aria-hidden="true"
                      className={`absolute -left-2.5 mt-1.5 h-5 w-5 rounded-full ring-4 ring-white flex items-center justify-center ${
                        idx === 0 ? 'bg-blue-700' : 'bg-[#0F2A4A]'
                      }`}
                    >
                      <div className="h-2 w-2 bg-white rounded-full" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-slate-900">
                        {item.accion}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 mb-1.5">
                        {formattedFecha}
                      </span>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-1 space-y-1.5">
                        <p className="text-sm font-semibold text-slate-800">
                          De: {areaOrigenObj?.nombre || 'Mesa de Partes'}
                        </p>
                        <p className="text-sm font-bold text-blue-800">
                          Hacia: {areaDestinoObj?.nombre || 'Mesa de Partes'}
                        </p>
                        {item.proveido ? (
                          <p className="text-sm text-slate-800 italic border-t border-slate-200 pt-1.5">
                            &ldquo;{item.proveido}&rdquo;
                          </p>
                        ) : (
                          <p className="text-sm text-slate-600 italic">
                            Sin observaciones
                          </p>
                        )}
                        {emisorNombre && (
                          <p className="text-xs font-semibold text-slate-600 pt-1 text-right">
                            Por: {emisorNombre}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}

