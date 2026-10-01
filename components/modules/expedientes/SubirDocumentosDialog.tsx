'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { subirDocumentosIntermediosAction } from '@/app/actions/expedientes'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UploadCloud, FileText, X, Loader2, AlertCircle, CheckCircle2, Plus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Props {
  expedienteId: string
}

export function SubirDocumentosDialog({ expedienteId }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const validFiles = Array.from(incoming).filter((f) => f.size > 0)
    setSelectedFiles((prev) => [...prev, ...validFiles])
    setErrorMsg(null)
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
      setErrorMsg('Debe seleccionar al menos un archivo.')
      return
    }

    setErrorMsg(null)
    setSuccessMsg(null)

    const formData = new FormData()
    formData.append('expediente_id', expedienteId)
    selectedFiles.forEach((file) => {
      formData.append('archivos', file)
    })

    startTransition(async () => {
      const res = await subirDocumentosIntermediosAction(formData)

      if (!res.success) {
        setErrorMsg(res.error || 'Error al subir los documentos.')
      } else {
        setSuccessMsg(`Se adjuntaron ${res.archivosSubidos || selectedFiles.length} documento(s) con éxito.`)
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
        <Button size="sm" variant="outline" className="gap-1.5 shadow-sm border-dashed">
          <Plus className="w-4 h-4 text-primary" />
          Anexar Documentos
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="text-lg">Anexar Documentos Internos</DialogTitle>
          <DialogDescription>
            Suba informes técnicos, providencias o anexos emitidos por su área para este trámite.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="break-words font-medium">{errorMsg}</AlertDescription>
          </Alert>
        )}

        {successMsg && (
          <Alert className="border-emerald-500 bg-emerald-50 text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <AlertDescription className="break-words font-medium">{successMsg}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={isPending}
            />
            <UploadCloud className="w-9 h-9 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-700">
              Haga clic para seleccionar o arrastre sus archivos aquí
            </p>
            <p className="text-xs text-slate-500 mt-1">PDF, Word o Imágenes (máx. 25MB por archivo)</p>
          </div>

          {/* Lista de archivos seleccionados */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Archivos listos para subir ({selectedFiles.length})
              </p>
              {selectedFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between p-2 rounded-md bg-slate-100 border text-xs text-slate-800"
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate font-medium">{file.name}</span>
                    <span className="text-slate-400 shrink-0">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-slate-200 text-slate-500 hover:text-slate-900"
                    onClick={() => removeFile(idx)}
                    disabled={isPending}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
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
            <Button type="submit" disabled={isPending || selectedFiles.length === 0}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Subir {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
