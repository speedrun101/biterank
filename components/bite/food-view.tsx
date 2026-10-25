'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, Trophy, X } from 'lucide-react'
import { getFoodLeaderboard } from '@/lib/api'
import { shiftLabel, type Offering } from '@/lib/bite-data'
import { useBite } from '@/lib/bite-store'
import { DishRow } from './dish-row'
import {
  DishThumb,
  EmptyState,
  FilterPills,
  IconButton,
  MonoLabel,
  Price,
  ScreenHeader,
  SectionLabel,
  Stars,
  listVariants,
} from './primitives'

type Filter = 'all' | 'veg' | 'day' | 'night' | 'under50'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'veg', label: 'Veg' },
  { id: 'day', label: 'Day' },
  { id: 'night', label: 'Night' },
  { id: 'under50', label: 'Under ₹50' },
]

// Normalise a raw Supabase menu_items row into the Offering shape used by HeroCard / DishRow
function normalise(row: any): Offering {
  const canteen = row.canteens ?? {}
  return {
    id: row.id,
    dishId: row.id,           // DishDetail uses dishId to look up by id
    hostelId: canteen.bhawan ?? '',
    shift: (canteen.shift_type ?? 'day') as any,
    price: row.price ?? 0,
    rating: row.avg_rating ?? 0,
    ratingCount: row.rating_count ?? 0,
    serveMin: row.prep_time_mins ?? 10,
    // Patch the objects dishById / hostelById would return so HeroCard can read them
    _dish: { id: row.id, name: row.name ?? '', image: row.image_url ?? '', veg: row.is_veg, cuisine: '' },
    _hostel: { id: canteen.bhawan ?? '', name: canteen.name ?? canteen.bhawan ?? '', short: canteen.bhawan ?? '' },
  } as any
}

export function FoodView() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const q = query.trim().toLowerCase()

  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Build API filters
  const apiFilters: any = {}
  if (q) apiFilters.search = q
  if (filter === 'veg') apiFilters.vegOnly = true
  if (filter === 'day' || filter === 'night') apiFilters.shift = filter
  if (filter === 'under50') apiFilters.under50 = true

  useEffect(() => {
    setLoading(true)
    getFoodLeaderboard(apiFilters).then((res) => {
      setData((res ?? []).map(normalise))
      setLoading(false)
    })
  }, [filter, q])

  const ranked = useMemo(() => {
    return [...data].sort((a, b) => (b.rating - a.rating) || (b.ratingCount - a.ratingCount))
  }, [data])

  const [top, ...rest] = ranked

  return (
    <div>
      <ScreenHeader
        eyebrow="Top rated on campus"
        title="Food Leaderboard"
        action={
          <IconButton label="Reset filters" onClick={() => { setFilter('all'); setQuery('') }}>
            <SlidersHorizontal className="size-4" aria-hidden />
          </IconButton>
        }
      />

      <div className="space-y-3 px-4">
        <label className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 focus-within:border-brand">
          <Search className="size-4 shrink-0 text-fg-3" aria-hidden />
          <span className="sr-only">Search dishes</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search dishes, e.g. "maggi"`}
            className="min-w-0 flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-fg-3 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="text-fg-3 hover:text-fg">
              <X className="size-4" aria-hidden />
            </button>
          )}
        </label>
        <FilterPills label="Filter dishes" options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      {top ? (
        <>
          <HeroCard offering={top} />
          <SectionLabel
            aside={
              <span className="inline-flex items-center gap-1.5">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
                </span>
                Updated live
              </span>
            }
          >
            Rankings
          </SectionLabel>
          {rest.length > 0 ? (
            <motion.ol
              key={`${filter}-${q}`}
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="space-y-3 px-4"
            >
              {rest.map((o, i) => (
                <DishRow key={o.id} offering={o} rank={i + 2} />
              ))}
            </motion.ol>
          ) : (
            <EmptyState title="Only one match" body="Try a broader filter to see more rankings." />
          )}
        </>
      ) : (
        <div className="pt-6">
          <EmptyState title="No dishes found" body={`Nothing matches "${query}". Try another dish or clear filters.`} />
        </div>
      )}
    </div>
  )
}

function HeroCard({ offering }: { offering: any }) {
  const { push } = useBite()
  const dish = (offering as any)._dish ?? { id: offering.id, name: '', image: '' }
  const hostel = (offering as any)._hostel ?? { name: '', short: '' }
  return (
    <div className="px-4 pt-5">
      <motion.button
        type="button"
        key={offering.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => push({ type: 'dish', dishId: dish.id, dishName: dish.name, offeringId: offering.id })}
        className="w-full rounded-3xl border border-brand/70 bg-gradient-to-br from-brand/15 via-surface to-surface p-4 text-left shadow-[0_0_40px_-12px_rgba(16,185,129,0.55)] focus-visible:outline-2 focus-visible:outline-brand"
      >
        <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-soft px-2 py-1 text-brand">
          <Trophy className="size-3.5" aria-hidden />
          <MonoLabel className="text-[12px]">#1 Campus favorite</MonoLabel>
        </span>
        <div className="mt-3 flex items-center gap-4">
          <DishThumb src={dish.image} alt={dish.name} size={76} className="rounded-2xl" />
          <div className="min-w-0">
            <p className="truncate font-display text-[22px] font-bold leading-tight text-fg">{dish.name}</p>
            <MonoLabel className="block text-[12px] text-fg-2">
              {hostel.name} · {shiftLabel(offering.shift)}
            </MonoLabel>
            <div className="mt-1 flex items-center gap-1.5">
              <Stars value={offering.rating} size={14} />
              <span className="font-mono text-[13px] text-fg">{offering.rating.toFixed(1)}</span>
              <span className="sr-only">out of 5</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <span className="rounded-full bg-elevated px-3 py-1 font-mono text-[13px] text-fg"><Price value={offering.price} /></span>
          <span className="rounded-full bg-elevated px-3 py-1 font-mono text-[13px] text-fg">
            {offering.ratingCount} ratings
          </span>
        </div>
      </motion.button>
    </div>
  )
}
