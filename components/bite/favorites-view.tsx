'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useBite } from '@/lib/bite-store'
import { getUserFavorites } from '@/lib/api'
import { DishRow } from './dish-row'
import { EmptyState, FilterPills, IconButton, ScreenHeader, SectionLabel, listVariants } from './primitives'

type Filter = 'all' | 'day' | 'night' | 'top'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'day', label: 'Day' },
  { id: 'night', label: 'Night' },
  { id: 'top', label: 'Top rated' },
]

/**
 * Transform a Supabase favourite row (menu_items with nested canteens) into the shape expected by DishRow.
 */
function offeringFromRow(row: any) {
  return {
    id: row.id,
    price: row.price ?? 0,
    rating: row.avg_rating ?? 0,
    ratingCount: row.rating_count ?? 0,
    serveMin: row.prep_time_mins ?? 10,
    shift: (row.canteens?.shift_type as any) ?? 'day',
    _dish: {
      id: row.dish_id ?? row.id,
      name: row.name ?? '',
      image: row.image_url ?? '',
      veg: row.is_veg ?? false,
      cuisine: row.cuisine ?? '',
    },
    _hostel: {
      name: row.canteens?.name ?? row.canteens?.bhawan ?? '',
      short: row.canteens?.bhawan ?? '',
    },
  }
}

export function FavoritesView() {
  const { user, favorites, setTab } = useBite()
  const [filter, setFilter] = useState<Filter>('all')
  const [favRows, setFavRows] = useState<any[]>([])

  // Load favorites from Supabase when we have a logged‑in user or when the favorites IDs change
  useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      try {
        const rows = await getUserFavorites(user.id)
        setFavRows(rows)
      } catch (e) {
        console.warn('Failed to load favorites', e)
        setFavRows([])
      }
    })()
  }, [user?.id, favorites])

  const items = useMemo(() => {
    let list = favRows.map(offeringFromRow)
    if (filter === 'day') list = list.filter((o) => o.shift === 'day')
    if (filter === 'night') list = list.filter((o) => o.shift === 'night')
    if (filter === 'top') list = [...list].sort((a, b) => b.rating - a.rating)
    return list
  }, [favRows, filter])

  return (
    <div>
      <ScreenHeader
        eyebrow="Saved by you"
        title="Favorites"
        action={
          <IconButton label="Browse dishes" onClick={() => setTab('food')}>
            <Heart className="size-4 text-rose" aria-hidden />
          </IconButton>
        }
      />
      <div className="px-4">
        <FilterPills label="Filter favorites" options={FILTERS} value={filter} onChange={setFilter} />
      </div>
      <SectionLabel aside={filter === 'top' ? 'Sorted by rating' : 'Sorted by recently added'}>
        {items.length} saved item{items.length === 1 ? '' : 's'}
      </SectionLabel>

      {items.length ? (
        <motion.ul key={filter} variants={listVariants} initial="hidden" animate="show" className="space-y-3 px-4">
          <AnimatePresence initial={false}>
            {items.map((o) => (
              <DishRow key={o.id} offering={o} />
            ))}
          </AnimatePresence>
        </motion.ul>
      ) : (
        <EmptyState
          title={favRows.length ? 'Nothing in this filter' : 'No favorites yet'}
          body={favRows.length ? 'Try another filter.' : 'Tap the heart on any dish to save it here.'}
        />
      )}
    </div>
  )
}
