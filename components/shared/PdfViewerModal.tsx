// components/shared/PdfViewerModal.tsx
'use client'

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Eye, ExternalLink } from 'lucide-react'

interface PdfViewerModalProps {
  url: string
  nombreArchivo: string
}

export function PdfViewerModal({ url, nombreArchivo }: PdfViewerModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={`Ver documento adjunto ${nombreArchivo}`}
          className="h-10 px-3.5 gap-2 rounded-xl border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <Eye className="w-4 h-4 text-blue-700" aria-hidden="true" />
          <span>Ver PDF</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-4xl md:max-w-5xl w-full max-h-[95vh] flex flex-col p-4 gap-3 rounded-xl">
        <DialogHeader className="flex flex-row items-center justify-between pr-8 border-b border-slate-200 pb-3">
          <DialogTitle
            className="text-base font-bold truncate text-slate-900"
            title={nombreArchivo}
          >
            {nombreArchivo}
          </DialogTitle>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir documento ${nombreArchivo} en una pestaña nueva`}
            className="text-sm font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1.5 shrink-0 ml-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded px-2 py-1"
            title="Abrir en pestaña nueva"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Nueva pestaña</span>
          </a>
        </DialogHeader>

        <div className="w-full flex-1 min-h-0">
          <iframe
            src={url}
            title={`Visor de documento PDF: ${nombreArchivo}`}
            aria-label={`Contenido del documento ${nombreArchivo}`}
            className="w-full h-[80vh] border-0 rounded-md bg-slate-50"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
