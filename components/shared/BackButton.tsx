// components/shared/BackButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BackButtonProps {
  fallbackUrl?: string
  label?: string
  className?: string
  variant?: 'outline' | 'default' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'xs'
}

export function BackButton({
  fallbackUrl = '/dashboard',
  label = 'Volver al panel anterior',
  className,
  variant = 'outline',
  size = 'sm',
}: BackButtonProps) {
  const router = useRouter()

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackUrl)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleBack}
      className={cn(
        'inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white text-sm font-semibold text-slate-800 hover:text-slate-900 hover:bg-slate-100 border-slate-300 shadow-2xs transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
        className
      )}
    >
      <ArrowLeft className="h-4 w-4 text-slate-700" aria-hidden="true" />
      <span>{label}</span>
    </Button>
  )
}

