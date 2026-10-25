'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDishWhereToGetIt } from '@/lib/api'
import { shiftLabel } from '@/lib/bite-data'
import { useBite } from '@/lib/bite-store'
import {
  BackButton,
  DishThumb,
  HeartButton,
  MonoLabel,
  Price,
  RatingPill,
  SectionLabel,
  Stars,
  itemVariants,
  listVariants,
} from './primitives'

export function DishDetail({ dishId, dishName, offeringId }: { dishId: string; dishName?: string; offeringId?: string }) {
  const { back, favorites, toggleFavorite, ratings, openRating } = useBite()
  const userRating = ratings[dishId]

  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    // Search by name so we find ALL canteens serving this dish.
    // dishName comes from the leaderboard row; fall back to dishId only if missing.
    const query = dishName || dishId
    getDishWhereToGetIt(query).then((data) => {
      setRows(data ?? [])
      setLoading(false)
    })
  }, [dishId])

  // Derive dish info from the first result row
  const first = rows[0]
  const dish = first
    ? { id: first.id, name: first.name ?? '', image: first.image_url ?? '', veg: first.is_veg, cuisine: first.cuisine ?? '' }
    : { id: dishId, name: '', image: '', veg: false, cuisine: '' }

  // Map DB rows to the shape the UI renders
  const offerings = rows.map((r) => ({
    id: r.id,
    canteenName: r.canteens?.bhawan ?? r.canteens?.name ?? '',
    shift: r.canteens?.shift_type ?? 'day',
    price: r.price ?? 0,
    rating: r.avg_rating ?? 0,
    serveMin: r.prep_time_mins ?? 10,
  }))

  const avgRating = offerings.length
    ? offerings.reduce((s, o) => s + o.rating, 0) / offerings.length
    : userRating?.stars ?? 0

  const [selected, setSelected] = useState<string | undefined>(offeringId ?? offerings[0]?.id)

  // Keep selected in sync once offerings load
  useEffect(() => {
    if (!selected && offerings.length) setSelected(offerings[0].id)
  }, [offerings.length])

  return (
    <div>
      <header className="flex items-center justify-between px-4 pt-6">
        <BackButton onClick={back} />
        {selected && (
          <HeartButton
            active={favorites.includes(selected)}
            onToggle={() => toggleFavorite(selected)}
            label={`${dish.name} at ${offerings.find((o) => o.id === selected)?.canteenName ?? ''}`}
          />
        )}
      </header>

      <section className="flex items-center gap-4 px-4 pt-5">
        <DishThumb src={dish.image} alt={dish.name} size={96} className="rounded-3xl" />
        <div className="min-w-0">
          <MonoLabel className="text-[12px] text-fg-2">
            {dish.cuisine || (dish.veg ? 'Veg' : 'Non-veg')}
          </MonoLabel>
          <h1 className="font-display text-2xl font-bold leading-tight text-fg">{dish.name || '…'}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Stars value={avgRating} size={16} />
            <span className="font-display text-[15px] font-semibold text-fg">{avgRating.toFixed(1)}</span>
            <span className="sr-only">out of 5</span>
          </div>
          <MonoLabel className="mt-1 block text-[10px] text-fg-3">{offerings.length} canteen{offerings.length === 1 ? '' : 's'}</MonoLabel>
        </div>
      </section>

      <div className="px-4 pt-5">
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => openRating(dishId)}
          className="w-full rounded-2xl bg-brand py-4 font-display text-[15px] font-semibold text-brand-on shadow-[0_8px_24px_-12px_rgba(16,185,129,0.8)]"
        >
          {userRating ? `Update your rating · ${userRating.stars} ${userRating.stars === 1 ? 'star' : 'stars'}` : 'Rate this item'}
        </motion.button>
      </div>

      <SectionLabel aside={`${offerings.length} canteen${offerings.length === 1 ? '' : 's'}`}>Where to get it</SectionLabel>
      {loading ? (
        <p className="px-4 text-sm text-fg-3">Loading…</p>
      ) : (
        <motion.ul
          variants={listVariants}
          initial="hidden"
          animate="show"
          role="radiogroup"
          aria-label="Choose a canteen"
          className="space-y-3 px-4"
        >
          {offerings.map((o) => {
            const active = o.id === selected
            return (
              <motion.li key={o.id} variants={itemVariants}>
                <motion.button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelected(o.id)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-2xl border bg-surface p-4 text-left transition-colors',
                    active ? 'border-brand shadow-[0_0_24px_-14px_rgba(16,185,129,0.9)]' : 'border-line hover:bg-elevated',
                  )}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-display text-[15px] font-semibold text-fg">
                      {o.canteenName} · {shiftLabel(o.shift as any)}
                      {active && <Check className="size-4 text-brand" aria-hidden />}
                    </span>
                    <MonoLabel className="text-[10px] text-fg-2">Avg serve {o.serveMin} min</MonoLabel>
                  </span>
                  <span className="flex flex-col items-end gap-1.5">
                    <span className="font-mono text-[16px] font-semibold text-brand"><Price value={o.price} /></span>
                    <RatingPill value={o.rating} />
                  </span>
                </motion.button>
              </motion.li>
            )
          })}
        </motion.ul>
      )}
    </div>
  )
}
