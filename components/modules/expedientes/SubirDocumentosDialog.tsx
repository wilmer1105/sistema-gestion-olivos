// components/modules/expedientes/SubirDocumentosDialog.tsx
'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { subirDocumentoIntermedioAction } from '@/app/actions/expedientes'
import { validarArchivoPdf } from '@/lib/validators/expediente.schema'
import type { TipoDocumentoTramite } from '@/types/database.types'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  UploadCloud,
  FileText,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Props {
  expedienteId: string
  disabled?: boolean
  tiposPermitidos?: TipoDocumentoTramite[]
}

const TIPOS_DOC_INTERMEDIO: Record<string, string> = {
  INFORME_TECNICO: 'Informe Técnico (INFORME_TECNICO)',
  INFORME_LEGAL: 'Informe Legal (INFORME_LEGAL)',
  ACTA_FISCALIZACION: 'Acta de Fiscalización (ACTA_FISCALIZACION)',
  RESOLUCION: 'Resolución Jefatural / Gerencial (RESOLUCION)',
  NOTIFICACION: 'Cargo de Notificación (NOTIFICACION)',
  OFICIO: 'Oficio (OFICIO)',
  CARTA: 'Carta (CARTA)',
  OTRO: 'Otro Documento Sustentatorio (OTRO)',
}

export function SubirDocumentosDialog({
  expedienteId,
  disabled = false,
  tiposPermitidos,
}: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const defaultTipo = tiposPermitidos && tiposPermitidos.length > 0
    ? tiposPermitidos[0]
    : 'INFORME_TECNICO'
  const [tipoDocumento, setTipoDocumento] =
    useState<TipoDocumentoTramite>(defaultTipo)

  const tiposOpciones =
    tiposPermitidos && tiposPermitidos.length > 0
      ? Object.entries(TIPOS_DOC_INTERMEDIO).filter(([key]) =>
          tiposPermitidos.includes(key as TipoDocumentoTramite)
        )
      : Object.entries(TIPOS_DOC_INTERMEDIO)

  const mapTiposFiltrados = Object.fromEntries(tiposOpciones)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return
    setErrorMsg(null)
    const validFiles: File[] = []
    for (const file of Array.from(incoming)) {
      const check = validarArchivoPdf({
        name: file.name,
        type: file.type || 'application/pdf',
        size: file.size,
      })
      if (!check.valido) {
        setErrorMsg(`${file.name}: ${check.error}`)
        return
      }
      validFiles.push(file)
    }
    setSelectedFiles((prev) => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFiles.length === 0) {
      setErrorMsg('Debe seleccionar al menos un archivo PDF.')
      return
    }

    setErrorMsg(null)
    setSuccessMsg(null)

    const formData = new FormData()
    formData.append('expediente_id', expedienteId)
    formData.append('tipo_documento', tipoDocumento)
    selectedFiles.forEach((file) => {
      formData.append('archivos', file)
    })

    startTransition(async () => {
      const res = await subirDocumentoIntermedioAction(formData)

      if (!res.success) {
        setErrorMsg(res.error || 'Error al subir los documentos.')
      } else {
        setSuccessMsg(
          `Se adjuntaron ${
            res.archivosSubidos || selectedFiles.length
          } documento(s) con éxito.`
        )
        setSelectedFiles([])
        setTimeout(() => {
          setOpen(false)
          setSuccessMsg(null)
        }, 1200)
        router.refresh()
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          setErrorMsg(null)
          setSuccessMsg(null)
          setSelectedFiles([])
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          disabled={disabled}
          aria-label="Subir informe o documento intermedio en PDF"
          className="gap-1.5 shadow-sm border-dashed"
        >
          <Plus className="w-4 h-4 text-primary" aria-hidden="true" />
          <span>Subir Informe / Documento</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Anexar Documento Sustentatorio Intermedio
          </DialogTitle>
          <DialogDescription>
            Suba informes técnicos, informes legales, actas de fiscalización o
            resoluciones en formato PDF emitidos por su unidad orgánica.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <Alert role="alert" aria-live="assertive" variant="destructive">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <AlertDescription className="break-words font-medium">
              {errorMsg}
            </AlertDescription>
          </Alert>
        )}

        {successMsg && (
          <Alert
            role="status"
            aria-live="polite"
            className="border-emerald-500 bg-emerald-50 text-emerald-800"
          >
            <CheckCircle2
              className="h-4 w-4 text-emerald-600 shrink-0"
              aria-hidden="true"
            />
            <AlertDescription className="break-words font-medium">
              {successMsg}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="tipo_documento_intermedio">
              Tipo de Documento Sustentatorio *
            </Label>
            <Select
              items={mapTiposFiltrados}
              itemToStringLabel={(val: string | null) =>
                val ? mapTiposFiltrados[String(val)] || String(val) : ''
              }
              value={tipoDocumento}
              onValueChange={(val: string | null) =>
                setTipoDocumento(
                  (val as TipoDocumentoTramite) || defaultTipo
                )
              }
              disabled={isPending}
            >
              <SelectTrigger id="tipo_documento_intermedio">
                <SelectValue placeholder="Seleccione el tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                {tiposOpciones.map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dropzone */}
          <div className="space-y-1.5">
            <Label htmlFor="archivos_pdf_intermedio">
              Archivos PDF a Anexar *
            </Label>
            <div
              role="button"
              tabIndex={0}
              aria-label="Seleccionar o arrastrar archivos PDF sustentatorios"
              aria-describedby="pdf-intermedio-ayuda"
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !isPending && fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (!isPending) fileInputRef.current?.click()
                }
              }}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
            >
              <input
                id="archivos_pdf_intermedio"
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
                disabled={isPending}
              />
              <UploadCloud
                className="w-9 h-9 mx-auto text-slate-500 mb-2"
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-slate-700">
                Haga clic, presione Enter o arrastre sus archivos PDF aquí
              </p>
              <p
                id="pdf-intermedio-ayuda"
                className="text-xs text-slate-600 mt-1"
              >
                Formato estricto PDF (máx. 10 MB por archivo)
              </p>
            </div>
          </div>

          {/* Lista de archivos seleccionados */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1" aria-live="polite">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Archivos listos para subir ({selectedFiles.length})
              </p>
              <ul aria-label="Archivos PDF seleccionados" className="space-y-2">
                {selectedFiles.map((file, idx) => (
                  <li
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between p-2 rounded-md bg-slate-100 border text-xs text-slate-800"
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <FileText
                        className="w-4 h-4 text-primary shrink-0"
                        aria-hidden="true"
                      />
                      <span className="truncate font-medium">{file.name}</span>
                      <span className="text-slate-600 shrink-0">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Quitar archivo ${file.name}`}
                      className="h-6 w-6 p-0 hover:bg-slate-200 text-slate-600 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-primary"
                      onClick={() => removeFile(idx)}
                      disabled={isPending}
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || selectedFiles.length === 0}
              aria-busy={isPending}
            >
              {isPending ? (
                <Loader2
                  className="w-4 h-4 mr-2 animate-spin"
                  aria-hidden="true"
                />
              ) : null}
              <span>
                Subir {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
              </span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
