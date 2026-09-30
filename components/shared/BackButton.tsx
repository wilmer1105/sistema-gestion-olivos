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
      className={cn('inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-900 border-slate-200 shadow-2xs transition-colors', className)}
    >
      <ArrowLeft className="h-4 w-4 text-slate-500" />
      <span>{label}</span>
    </Button>
  )
}
