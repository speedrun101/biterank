'use client'

import { motion } from 'framer-motion'
import { Heart, Store, User, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBite, type Tab } from '@/lib/bite-store'

const TABS: { id: Tab; label: string; Icon: typeof Heart }[] = [
  { id: 'food', label: 'Food', Icon: Utensils },
  { id: 'canteens', label: 'Canteens', Icon: Store },
  { id: 'favorites', label: 'Favorites', Icon: Heart },
  { id: 'profile', label: 'Profile', Icon: User },
]

export function BottomNav() {
  const { tab, setTab } = useBite()
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[420px] border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id
          return (
            <li key={id}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => setTab(id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex w-full flex-col items-center gap-1 py-2.5 text-[12px] transition-colors focus-visible:outline-2 focus-visible:outline-brand',
                  active ? 'text-brand' : 'text-fg-2 hover:text-fg',
                )}
              >
                <span className="relative flex h-8 w-14 items-center justify-center">
                  {active && (
                    <motion.span
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-full bg-brand-soft"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon className={cn('relative size-5', active && id === 'favorites' && 'fill-brand')} aria-hidden />
                </span>
                {label}
              </motion.button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
