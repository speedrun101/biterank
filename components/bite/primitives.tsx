'use client'

import Image from 'next/image'
import { motion, useAnimationControls } from 'framer-motion'
import { ChevronLeft, Heart, Moon, Star, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { Shift } from '@/lib/bite-data'

export function MonoLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('font-mono text-[11px] uppercase tracking-wider', className)}>{children}</span>
}

export function ScreenHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3 px-4 pb-4 pt-6">
      <div className="min-w-0">
        <MonoLabel className="text-brand">{eyebrow}</MonoLabel>
        <h1 className="font-display text-2xl font-bold leading-tight text-fg">{title}</h1>
      </div>
      {action}
    </header>
  )
}

export function IconButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string
  onClick?: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-fg transition-colors hover:bg-elevated focus-visible:outline-2 focus-visible:outline-brand',
        className,
      )}
    >
      {children}
    </motion.button>
  )
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <IconButton label="Go back" onClick={onClick}>
      <ChevronLeft className="size-5" aria-hidden />
    </IconButton>
  )
}

export function Stars({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i <= Math.round(value) ? 'fill-star text-star' : 'text-fg-3'}
        />
      ))}
    </span>
  )
}

export function RatingInline({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 font-mono text-[12px] text-fg-2', className)}>
      <Star className="size-3 fill-star text-star" aria-hidden />
      <span className="text-fg">{value.toFixed(1)}</span>
      <span className="sr-only">out of 5</span>
    </span>
  )
}

export function RatingPill({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-2 py-0.5 font-mono text-[12px] font-medium text-brand">
      <Star className="size-3 fill-brand text-brand" aria-hidden />
      {value.toFixed(1)}
      <span className="sr-only">out of 5 stars</span>
    </span>
  )
}

export function DishThumb({ src, alt, size = 56, className }: { src: string; alt: string; size?: number; className?: string }) {
  return (
    <div
      className={cn('relative shrink-0 overflow-hidden rounded-xl border border-line/60 bg-elevated', className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-2xl select-none" aria-hidden>🍽️</span>
      )}
    </div>
  )
}

export function HeartButton({ active, onToggle, label }: { active: boolean; onToggle: () => void; label: string }) {
  const controls = useAnimationControls()
  return (
    <motion.button
      type="button"
      aria-label={active ? `Remove ${label} from favorites` : `Save ${label} to favorites`}
      aria-pressed={active}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
        controls.start({ scale: [0.8, 1.3, 1], transition: { duration: 0.32, ease: 'easeOut' } })
      }}
      whileTap={{ scale: 0.9 }}
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-brand',
        active ? 'border-rose/30 bg-rose/15' : 'border-line bg-elevated hover:border-fg-3',
      )}
    >
      <motion.span animate={controls} className="flex">
        <Heart
          className={cn('size-4 transition-colors', active ? 'fill-rose text-rose' : 'text-fg-2')}
          aria-hidden
        />
      </motion.span>
    </motion.button>
  )
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
      {options.map((o) => {
        const active = o.id === value
        return (
          <motion.button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            whileTap={{ scale: 0.96 }}
            className={cn(
              'shrink-0 rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors',
              active ? 'border-brand bg-brand text-brand-on' : 'border-line bg-surface text-fg-2 hover:text-fg',
            )}
          >
            {o.label}
          </motion.button>
        )
      })}
    </div>
  )
}

export function ShiftToggle({ value, onChange, layoutId }: { value: Shift; onChange: (s: Shift) => void; layoutId: string }) {
  const opts: { id: Shift; label: string; Icon: typeof Sun }[] = [
    { id: 'day', label: 'Day Canteens', Icon: Sun },
    { id: 'night', label: 'Night Canteens', Icon: Moon },
  ]
  return (
    <div role="radiogroup" aria-label="Canteen shift" className="grid grid-cols-2 rounded-2xl border border-line bg-surface p-1">
      {opts.map(({ id, label, Icon }) => {
        const active = value === id
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(id)}
            className={cn(
              'relative flex items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-medium transition-colors',
              active ? 'text-brand-on' : 'text-fg-2 hover:text-fg',
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl bg-brand"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <Icon className="relative size-4" aria-hidden />
            <span className="relative">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function SectionLabel({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-5">
      <MonoLabel className="text-[12px] text-fg-3">{children}</MonoLabel>
      {aside && <span className="text-[12px] text-fg-3">{aside}</span>}
    </div>
  )
}

export const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

export const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.2 } },
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-4 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      <p className="font-display text-[15px] font-semibold text-fg">{title}</p>
      <p className="mt-1 text-[14px] text-fg-2">{body}</p>
    </div>
  )
}

export function Price({ value }: { value: number }) {
  return (
    <>
      <span className="font-sans">₹</span>
      {value}
    </>
  )
}
