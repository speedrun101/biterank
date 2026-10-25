'use client'

import { useMemo, useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Check, ChevronRight, House, LogOut, Pencil } from 'lucide-react'
import { getDishById } from '@/lib/api'
import { cn } from '@/lib/utils'
import { HOSTELS } from '@/lib/bite-data'
import { useBite } from '@/lib/bite-store'
import { BottomSheet } from './bottom-sheet'
import { DishThumb, EmptyState, MonoLabel, ScreenHeader, SectionLabel, Stars, itemVariants, listVariants } from './primitives'

export function ProfileView() {
  const { user, favorites, ratings, dishDetails, setDishDetails, openRating, notifications, setNotifications, setHostelSheetOpen, signOut } = useBite()
  const [showAll, setShowAll] = useState(false)

  const myRatings = useMemo(
    () => Object.entries(ratings).sort((a, b) => b[1].at - a[1].at),
    [ratings],
  )

  // Load missing dish details for ratings
  useEffect(() => {
    const missingIds = myRatings
      .map(([id]) => id)
      .filter((id) => !(id in dishDetails))
    if (!user || missingIds.length === 0) return
    ;(async () => {
      const promises = missingIds.map((mid) => getDishById(mid))
      const results = await Promise.all(promises)
      const newMap: Record<string, { name: string; hostel: string; shift: string; image?: string }> = {}
      results.forEach((data) => {
        if (data) {
          newMap[data.id] = {
            name: data.name,
            hostel: data.canteens?.bhawan ?? '',
            shift: data.canteens?.shift_type ?? '',
            image: data.image_url ?? '',
          }
        }
      })
      setDishDetails((prev) => ({ ...prev, ...newMap }))
    })()
  }, [user, myRatings, dishDetails, setDishDetails])
  const avg = myRatings.length ? myRatings.reduce((s, [, r]) => s + r.stars, 0) / myRatings.length : 0
  const visible = showAll ? myRatings : myRatings.slice(0, 3)

  if (!user) return null
  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div>
      <ScreenHeader eyebrow="Your account" title="Profile" />

      <section className="mx-4 flex items-center gap-4 rounded-3xl border border-line bg-surface p-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-brand bg-brand-soft font-display text-[22px] font-bold text-brand">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-[18px] font-semibold text-fg">{user.name}</p>
          <p className="truncate font-mono text-[13px] text-fg-2">{user.email}</p>
          <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-brand-soft px-2 py-0.5 text-brand">
            <House className="size-3" aria-hidden />
            <MonoLabel className="text-[10px]">{user.hostelId}</MonoLabel>
          </span>
        </div>
      </section>

      <dl className="grid grid-cols-3 gap-2.5 px-4 pt-3">
        <Stat value={String(myRatings.length)} label="Ratings given" />
        <Stat value={String(favorites.length)} label="Favorites" />
        <Stat value={avg ? avg.toFixed(1) : '–'} label="Avg given" />
      </dl>

      <SectionLabel
        aside={
          myRatings.length > 3 ? (
            <button type="button" onClick={() => setShowAll((s) => !s)} className="text-brand hover:underline">
              {showAll ? 'Show less' : 'See all'}
            </button>
          ) : undefined
        }
      >
        My ratings
      </SectionLabel>

      {myRatings.length ? (
        <motion.ul variants={listVariants} initial="hidden" animate="show" className="space-y-2.5 px-4">
          <AnimatePresence initial={false}>
            {visible.map(([itemId, r]) => {
              return (
                <motion.li
                  key={itemId}
                  variants={itemVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  layout="position"
                  className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3"
                >
                  <DishThumb src={dishDetails[itemId]?.image ?? ''} alt={dishDetails[itemId]?.name ?? ''} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[15px] font-semibold text-fg">{dishDetails[itemId]?.name ?? itemId.slice(0,8)}</p>
                    <div className="text-sm text-fg-2">{dishDetails[itemId]?.hostel} • {dishDetails[itemId]?.shift}</div>
<div className="flex items-center gap-2">
                      <Stars value={r.stars} size={12} />
                      <span className="sr-only">{r.stars} out of 5</span>
                      {r.waitMin !== undefined && (
                        <MonoLabel className="text-fg-3">· waited {r.waitMin}m</MonoLabel>
                      )}
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    aria-label={`Edit rating`}
                    onClick={() => openRating(itemId)}
                    className="flex size-10 items-center justify-center rounded-full border border-line bg-elevated text-fg-2 hover:text-fg"
                  >
                    <Pencil className="size-4" aria-hidden />
                  </motion.button>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </motion.ul>
      ) : (
        <EmptyState title="No ratings yet" body="Rate a dish to help everyone eat better." />
      )}

      <div className="mx-4 mt-5 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Bell className="size-4 text-fg-2" aria-hidden />
          <span id="notif-label" className="flex-1 text-[14px] text-fg">
            Notifications
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={notifications}
            aria-labelledby="notif-label"
            onClick={() => setNotifications(!notifications)}
            className={cn(
              'relative h-6 w-11 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-brand',
              notifications ? 'bg-brand' : 'bg-line',
            )}
          >
            <motion.span
              layout
              transition={{ type: 'spring', stiffness: 600, damping: 34 }}
              className={cn('absolute top-0.5 size-5 rounded-full bg-fg', notifications ? 'right-0.5' : 'left-0.5')}
            />
          </button>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => setHostelSheetOpen(true)}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-elevated"
        >
          <House className="size-4 text-fg-2" aria-hidden />
          <span className="flex-1 text-[14px] text-fg">Change hostel</span>
          <MonoLabel className="text-fg-3">{user.hostelId}</MonoLabel>
          <ChevronRight className="size-4 text-fg-3" aria-hidden />
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={signOut}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-rose hover:bg-rose/10"
        >
          <LogOut className="size-4" aria-hidden />
          <span className="flex-1 text-[14px] font-medium">Log out</span>
        </motion.button>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col-reverse rounded-2xl border border-line bg-surface p-3">
      <dt>
        <MonoLabel className="text-[10px] text-fg-2">{label}</MonoLabel>
      </dt>
      <dd className="font-display text-[22px] font-bold text-fg">{value}</dd>
    </div>
  )
}

export function HostelSheet() {
  const { user, hostelSheetOpen, setHostelSheetOpen, setHostel } = useBite()
  return (
    <BottomSheet
      open={hostelSheetOpen}
      onClose={() => setHostelSheetOpen(false)}
      eyebrow="Your home canteen"
      title="Change hostel"
    >
      <ul role="radiogroup" aria-label="Hostel" className="max-h-[50vh] space-y-2 overflow-y-auto">
        {HOSTELS.map((h) => {
          const active = user?.hostelId === h.id
          return (
            <li key={h.id}>
              <motion.button
                type="button"
                role="radio"
                aria-checked={active}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setHostel(h.id)
                  setHostelSheetOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors',
                  active ? 'border-brand bg-brand-soft' : 'border-line bg-elevated hover:border-fg-3',
                )}
              >
                <span className="font-display text-[15px] font-semibold text-fg">{h.name}</span>
                {active && <Check className="size-4 text-brand" aria-hidden />}
              </motion.button>
            </li>
          )
        })}
      </ul>
    </BottomSheet>
  )
}
