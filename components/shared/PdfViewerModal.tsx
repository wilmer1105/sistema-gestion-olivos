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
        <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer">
          <Eye className="w-4 h-4 text-slate-600" />
          <span>Ver</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-4xl md:max-w-5xl w-full max-h-[95vh] flex flex-col p-4 gap-3">
        <DialogHeader className="flex flex-row items-center justify-between pr-8 border-b pb-2">
          <DialogTitle className="text-base font-semibold truncate text-slate-800" title={nombreArchivo}>
            {nombreArchivo}
          </DialogTitle>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-500 hover:text-primary flex items-center gap-1 shrink-0 ml-2"
            title="Abrir en pestaña nueva"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nueva pestaña</span>
          </a>
        </DialogHeader>

        <div className="w-full flex-1 min-h-0">
          <iframe
            src={url}
            title={nombreArchivo}
            className="w-full h-[80vh] border-0 rounded-md bg-slate-50"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
