'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Moon, Search, Sun, X } from 'lucide-react'
import { getCanteensDirectory, getCanteenMenu } from '@/lib/api'
import { shiftLabel, type Shift } from '@/lib/bite-data'
import { useBite } from '@/lib/bite-store'
import {
  EmptyState,
  IconButton,
  MonoLabel,
  RatingPill,
  ScreenHeader,
  SectionLabel,
  ShiftToggle,
  itemVariants,
  listVariants,
} from './primitives'

// Each row from canteen_stats is one canteen (one shift of one bhawan).
// We group them by bhawan so one card = one hostel, both shifts inside.
type CanteenEntry = {
  id: string     // canteen row id – used as hostelId when navigating
  shift: Shift
}

type BhawanGroup = {
  bhawan: string          // e.g. "Azad Bhawan"
  canteens: CanteenEntry[]
}

function groupByBhawan(rows: any[]): BhawanGroup[] {
  const map = new Map<string, BhawanGroup>()
  for (const row of rows) {
    const bhawan: string = row.bhawan ?? row.name ?? 'Unknown'
    if (!map.has(bhawan)) map.set(bhawan, { bhawan, canteens: [] })
    map.get(bhawan)!.canteens.push({
      id: row.id,
      shift: (row.shift_type ?? 'day') as Shift,
    })
  }
  return Array.from(map.values()).sort((a, b) => a.bhawan.localeCompare(b.bhawan))
}

export function CanteensView() {
  const [shift, setShift] = useState<Shift>('day')
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const [groups, setGroups] = useState<BhawanGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getCanteensDirectory().then((data) => {
      setGroups(groupByBhawan(data || []))
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    if (!q) return groups
    return groups.filter((g) => g.bhawan.toLowerCase().includes(q))
  }, [groups, q])

  return (
    <div>
      <ScreenHeader
        eyebrow="Every hostel · Day & Night"
        title="Canteens"
        action={
          <IconButton
            label={searching ? 'Close hostel search' : 'Search hostels'}
            onClick={() => {
              setSearching((s) => !s)
              setQuery('')
            }}
          >
            {searching ? <X className="size-4" aria-hidden /> : <Search className="size-4" aria-hidden />}
          </IconButton>
        }
      />

      <div className="space-y-3 px-4">
        {searching && (
          <motion.label
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 focus-within:border-brand"
          >
            <Search className="size-4 text-fg-3" aria-hidden />
            <span className="sr-only">Search hostels</span>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hostels, e.g. Cautley"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-fg-3"
            />
          </motion.label>
        )}
        <ShiftToggle value={shift} onChange={setShift} layoutId="canteens-shift" />
      </div>

      <SectionLabel aside={<span className="text-brand">Sort: A–Z</span>}>All hostels</SectionLabel>

      {loading ? (
        <EmptyState title="Loading…" body="Fetching canteens" />
      ) : filtered.length ? (
        <motion.ul
          key={q}
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="space-y-4 px-4"
        >
          {filtered.map((g) => (
            <BhawanCard key={g.bhawan} group={g} activeShift={shift} />
          ))}
        </motion.ul>
      ) : (
        <EmptyState title="No hostels found" body="Check the spelling and try again." />
      )}
    </div>
  )
}

/** One card per bhawan – always shows both day and night rows */
function BhawanCard({ group, activeShift }: { group: BhawanGroup; activeShift: Shift }) {
  const count = group.canteens.length
  return (
    <motion.li variants={itemVariants} className="rounded-3xl border border-line bg-surface p-4">
      <h2 className="font-display text-[18px] font-semibold text-fg">{group.bhawan}</h2>
      <MonoLabel className="text-[12px] text-fg-3">
        {count} canteen{count !== 1 ? 's' : ''} · Day + Night
      </MonoLabel>
      <div className="mt-3 space-y-2.5">
        {/* Always render day first, then night */}
        {(['day', 'night'] as Shift[]).map((s) => {
          const entry = group.canteens.find((c) => c.shift === s)
          if (!entry) return null
          return (
            <CanteenRow
              key={s}
              canteenId={entry.id}
              shift={s}
              highlighted={s === activeShift}
            />
          )
        })}
      </div>
    </motion.li>
  )
}

/** One row per shift inside the bhawan card */
function CanteenRow({
  canteenId,
  shift,
  highlighted,
}: {
  canteenId: string
  shift: Shift
  highlighted: boolean
}) {
  const { push } = useBite()
  const Icon = shift === 'day' ? Sun : Moon
  const [stats, setStats] = useState<{ rating: number; items: number; serve: number } | null>(null)

  useEffect(() => {
    getCanteenMenu(canteenId).then((menu: any[]) => {
      const rating =
        menu.reduce((acc, item) => acc + (item.avg_rating || 0), 0) / (menu.length || 1)
      const serveAvg =
        menu.reduce((acc, item) => acc + (item.avg_prep_time || 0), 0) / (menu.length || 1)
      setStats({ rating, items: menu.length, serve: Math.round(serveAvg) })
    })
  }, [canteenId])

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => push({ type: 'canteen', hostelId: canteenId, shift })}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors hover:bg-elevated focus-visible:outline-2 focus-visible:outline-brand ${
        highlighted ? 'border-brand/40 bg-elevated/70' : 'border-transparent bg-elevated/40'
      }`}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-base">
        <Icon className={`size-5 ${shift === 'day' ? 'text-star' : 'text-fg-2'}`} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-fg">{shiftLabel(shift)} Canteen</span>
        <MonoLabel className="block truncate text-fg-2">
          <span className="text-brand">Open</span>
          {stats ? ` · ${stats.items} items · ~${stats.serve} min` : ''}
        </MonoLabel>
      </span>
      {stats && <RatingPill value={stats.rating} />}
      <ChevronRight className="size-4 shrink-0 text-fg-3" aria-hidden />
    </motion.button>
  )
}
