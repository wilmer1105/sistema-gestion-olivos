// components/modules/expedientes/ExpedienteCreateForm.tsx
'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createExpedienteAction } from '@/app/actions/expedientes'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ShieldAlert, User, FileText, FileCheck, Trash2, Plus, UploadCloud } from 'lucide-react'

export function ExpedienteCreateForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Referencia al input file oculto para abrir el selector bajo demanda
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados controlados para los componentes Select de Shadcn/Base-UI
  const [tipoDoc, setTipoDoc] = useState('DNI')
  const [tipoTramite, setTipoTramite] = useState('FUT')

  // Estado para acumular múltiples archivos
  const [archivos, setArchivos] = useState<File[]>([])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    const nuevosArchivos: File[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo ' + file.name + ' supera los 5MB')
      } else {
        // Evitar duplicados exactos (mismo nombre y tamaño)
        const yaExiste = archivos.some(
          (a) => a.name === file.name && a.size === file.size
        )
        if (!yaExiste) {
          nuevosArchivos.push(file)
        }
      }
    }

    if (nuevosArchivos.length > 0) {
      setArchivos((prev) => [...prev, ...nuevosArchivos])
    }

    // Limpiar el valor del input para que permita volver a seleccionar el mismo u otros archivos
    e.target.value = ''
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleRemoveFile(indexToRemove: number) {
    setArchivos((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setServerError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    // Garantizar que los valores de los selects se incluyan en el FormData
    formData.set('tipo_documento_identidad', tipoDoc)
    formData.set('tipo_tramite', tipoTramite)

    // Limpiar 'archivos' en caso de que el input tenga asignado el nombre
    formData.delete('archivos')

    // Al enviar el formulario (onSubmit), añadir todos los archivos seleccionados en un bucle
    for (const file of archivos) {
      formData.append('archivos', file)
    }

    startTransition(async () => {
      const res = await createExpedienteAction(formData)
      if (!res.success || res.error) {
        setServerError(res.error || 'Ocurrió un error inesperado al registrar el expediente.')
      } else if (res.success) {
        router.push('/dashboard/bandeja')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Mensaje de Error */}
      {serverError && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grid de 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Columna 1: Datos del Administrado */}
          <Card className="shadow-sm border">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <CardTitle className="text-base font-semibold text-slate-800">1. Datos del Administrado</CardTitle>
              </div>
              <CardDescription>Identificación del titular, remitente o solicitante.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              {/* Tipo de Documento y Número de Documento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="tipo_documento_identidad">Tipo Doc. *</Label>
                  <Select value={tipoDoc} onValueChange={(val: any) => setTipoDoc(val)} disabled={isPending}>
                    <SelectTrigger id="tipo_documento_identidad">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DNI">DNI</SelectItem>
                      <SelectItem value="RUC">RUC</SelectItem>
                      <SelectItem value="CE">Carné Ext. (CE)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="remitente_dni_ruc">N° de Documento *</Label>
                  <Input
                    id="remitente_dni_ruc"
                    name="remitente_dni_ruc"
                    placeholder={tipoDoc === 'RUC' ? '20123456789' : '45892134'}
                    maxLength={tipoDoc === 'RUC' ? 11 : tipoDoc === 'DNI' ? 8 : 12}
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Nombres o Razón Social */}
              <div className="space-y-1.5">
                <Label htmlFor="remitente_nombres">Nombres y Apellidos / Razón Social *</Label>
                <Input
                  id="remitente_nombres"
                  name="remitente_nombres"
                  placeholder="Ej. Juan Pérez Quispe / Inversiones SAC"
                  required
                  disabled={isPending}
                />
              </div>

              {/* Correo y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="correo">Correo Electrónico</Label>
                  <Input
                    id="correo"
                    name="correo"
                    type="email"
                    placeholder="administrado@correo.com"
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="telefono">Teléfono / Celular</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    placeholder="987654321"
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-1.5">
                <Label htmlFor="direccion">Dirección Domiciliaria / Fiscal</Label>
                <Input
                  id="direccion"
                  name="direccion"
                  placeholder="Av. Antúnez de Mayolo 1234, Los Olivos"
                  disabled={isPending}
                />
              </div>

            </CardContent>
          </Card>

          {/* Columna 2: Datos del Trámite */}
          <Card className="shadow-sm border">
            <CardHeader className="bg-slate-50 border-b pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle className="text-base font-semibold text-slate-800">2. Datos del Trámite</CardTitle>
              </div>
              <CardDescription>Tipo de expediente, contenido y documentos adjuntos.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              
              {/* Tipo de Trámite y Número de Folios */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="tipo_tramite">Tipo de Trámite *</Label>
                  <Select value={tipoTramite} onValueChange={(val: any) => setTipoTramite(val)} disabled={isPending}>
                    <SelectTrigger id="tipo_tramite">
                      <SelectValue placeholder="Seleccione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FUT">FUT (Formulario Único)</SelectItem>
                      <SelectItem value="Carta">Carta</SelectItem>
                      <SelectItem value="Oficio">Oficio</SelectItem>
                      <SelectItem value="Solicitud">Solicitud</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="folios">N° Folios *</Label>
                  <Input
                    id="folios"
                    name="folios"
                    type="number"
                    min={1}
                    defaultValue={1}
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Asunto */}
              <div className="space-y-1.5">
                <Label htmlFor="asunto">Asunto del Trámite *</Label>
                <Textarea
                  id="asunto"
                  name="asunto"
                  rows={3}
                  placeholder="Describa de manera concisa el motivo o solicitud del expediente..."
                  required
                  disabled={isPending}
                />
              </div>

              {/* Archivos Adjuntos con Selección Múltiple y Carga Progresiva */}
              <div className="space-y-2">
                <Label>Archivos Digitales Adjuntos (PDF / Imágenes)</Label>
                
                {/* Input de archivo oculto manejado programáticamente */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  disabled={isPending}
                  className="hidden"
                />

                {archivos.length === 0 ? (
                  /* Zona de carga inicial */
                  <div
                    onClick={() => !isPending && fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 rounded-lg p-5 text-center cursor-pointer transition-colors"
                  >
                    <div className="mx-auto flex flex-col items-center justify-center gap-1.5">
                      <div className="p-2.5 bg-primary/10 rounded-full text-primary">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">Haga clic aquí para seleccionar archivos</p>
                        <p className="text-xs text-slate-500 mt-0.5">Formatos permitidos: .pdf, .jpg, .png (Hasta 5MB por archivo)</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Lista de archivos ya cargados y botón abajo para cargar otro */
                  <div className="space-y-3">
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {archivos.map((archivo, index) => (
                        <div
                          key={`${archivo.name}-${archivo.size}-${index}`}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm shadow-xs"
                        >
                          <div className="flex items-center gap-2.5 truncate mr-2">
                            <div className="p-1.5 bg-primary/10 rounded text-primary shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <p className="text-sm font-medium text-slate-800 truncate" title={archivo.name}>
                                {archivo.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {(archivo.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            disabled={isPending}
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors shrink-0 cursor-pointer"
                            title="Eliminar archivo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Botón justo debajo de los archivos cargados para adjuntar otro */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isPending}
                      className="w-full border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 text-slate-700 gap-1.5 h-9 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-primary" />
                      <span>+ Cargar otro archivo</span>
                    </Button>
                    <p className="text-[11px] text-slate-500 text-center">
                      Formatos: .pdf, .jpg, .png (Máx. 5MB cada uno). Puede agregar los archivos que necesite.
                    </p>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>

        </div>

        {/* Botón de Envío */}
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending} size="lg" className="px-8 shadow-sm cursor-pointer">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo y Registrando...
              </>
            ) : (
              <>
                <FileCheck className="mr-2 h-4 w-4" />
                Ingresar Expediente
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}