import * as React from 'react'
import { cn } from '@/lib/utils'

type CinematicSectionProps = React.HTMLAttributes<HTMLElement> & {
  variant?: 'light' | 'dark'
  innerClassName?: string
}

export function CinematicSection({
  className,
  innerClassName,
  variant = 'light',
  children,
  ...props
}: CinematicSectionProps) {
  return (
    <section
      className={cn(
        'rounded-3xl p-4 sm:p-6 lg:p-8',
        variant === 'dark' ? 'cinematic-dark-panel' : 'cinematic-shell',
        className,
      )}
      {...props}
    >
      <div className={cn('relative z-10', innerClassName)}>{children}</div>
    </section>
  )
}
