'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Info, Minus, Pencil, Plus, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { dishAggregate, dishById } from '@/lib/bite-data'
import { getDishById } from '@/lib/api'
import { useBite } from '@/lib/bite-store'
import { BottomSheet } from './bottom-sheet'

const LABELS = ['', 'Skip it', 'Meh', 'Decent', 'Really good', 'Must try']

export function RatingSheet() {
  const { ratingDishId, openRating } = useBite()
  const staticDish = ratingDishId ? dishById(ratingDishId) : null
  const [dish, setDish] = useState<any>(staticDish)
  useEffect(() => {
    if (ratingDishId) {
      if (staticDish) {
        setDish(staticDish)
      } else {
        getDishById(ratingDishId).then(setDish)
      }
    } else {
      setDish(null)
    }
  }, [ratingDishId, staticDish])
  return (
    <BottomSheet
      open={!!dish}
      onClose={() => openRating(null)}
      eyebrow="Your rating · One per item"
      title={dish ? `Rate ${dish.name}` : ''}
    >
      {dish && <RatingForm key={dish.id} dishId={dish.id} />}
    </BottomSheet>
  )
}

function RatingForm({ dishId }: { dishId: string }) {
  const { ratings, rate, removeRating, openRating } = useBite()
  const existing = ratings[dishId]
  const [stars, setStars] = useState(existing?.stars ?? 0)
  const [wait, setWait] = useState<number | ''>(existing?.waitMin ?? '')
  const [pop, setPop] = useState(0)

  const preview = stars ? dishAggregate(dishId, stars).rating : null

  return (
    <div>
      <div role="radiogroup" aria-label="Star rating" className="flex justify-center gap-3">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= stars
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={stars === i}
              aria-label={`${i} star${i > 1 ? 's' : ''}`}
              onClick={() => {
                setStars(i)
                setPop((p) => p + 1)
              }}
              className="rounded-lg p-1 focus-visible:outline-2 focus-visible:outline-brand"
            >
              <motion.span
                key={i === stars ? `pop-${pop}` : 'idle'}
                className="flex"
                initial={false}
                animate={i === stars ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <Star
                  className={cn('size-10 transition-colors', filled ? 'fill-star text-star' : 'text-fg-3')}
                  strokeWidth={1.5}
                  aria-hidden
                />
              </motion.span>
            </button>
          )
        })}
      </div>
      <p className="mt-2 h-5 text-center text-[14px] text-fg-2" aria-live="polite">
        {stars ? `${LABELS[stars]}${preview ? ` · new avg ${preview.toFixed(2)}` : ''}` : 'Tap a star to rate'}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-elevated px-4 py-3">
        <label htmlFor="wait-min" className="text-[14px] text-fg">
          Wait time
          <span className="block font-mono text-[11px] uppercase tracking-wider text-fg-3">Optional · minutes</span>
        </label>
        <div className="flex items-center gap-2">
          <StepButton label="Decrease wait time" onClick={() => setWait((w) => Math.max(0, (w || 0) - 1))}>
            <Minus className="size-4" aria-hidden />
          </StepButton>
          <input
            id="wait-min"
            inputMode="numeric"
            value={wait}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 2)
              setWait(v === '' ? '' : Number(v))
            }}
            placeholder="–"
            className="w-10 rounded-lg bg-base py-1.5 text-center font-mono text-[14px] text-fg outline-none focus:ring-1 focus:ring-brand"
          />
          <StepButton label="Increase wait time" onClick={() => setWait((w) => Math.min(99, (w || 0) + 1))}>
            <Plus className="size-4" aria-hidden />
          </StepButton>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-elevated/70 px-4 py-3 text-[13px] leading-relaxed text-fg-2">
        {existing ? (
          <>
            <Pencil className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
            <p>
              You gave {existing.stars} {existing.stars === 1 ? 'star' : 'stars'} before. Saving replaces it, and the item average recalculates.
            </p>
          </>
        ) : (
          <>
            <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
            <p>One rating per item. You can update or remove it anytime.</p>
          </>
        )}
      </div>

      <div className="mt-5 space-y-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          disabled={!stars}
          onClick={() => {
            rate(dishId, stars, wait === '' ? undefined : wait)
            openRating(null)
          }}
          className="w-full rounded-2xl bg-brand py-4 font-display text-[15px] font-semibold text-brand-on transition-opacity disabled:opacity-40"
        >
          {existing ? 'Update rating' : 'Submit rating'}
        </motion.button>
        {existing && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              removeRating(dishId)
              openRating(null)
            }}
            className="w-full rounded-2xl border border-line bg-elevated py-4 font-display text-[15px] font-semibold text-fg transition-colors hover:border-rose/50 hover:text-rose"
          >
            Remove my rating
          </motion.button>
        )}
      </div>
    </div>
  )
}

function StepButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-full border border-line bg-surface text-fg-2 hover:text-fg"
    >
      {children}
    </motion.button>
  )
}
