'use client'

import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { shiftLabel, type Offering } from '@/lib/bite-data'
import { useBite } from '@/lib/bite-store'
import { DishThumb, HeartButton, MonoLabel, Price, RatingInline, itemVariants } from './primitives'

export function DishRow({ offering, rank }: { offering: any; rank?: number }) {
  const { favorites, toggleFavorite, push } = useBite()
  const dish = (offering as any)._dish ?? { id: offering.id, name: offering.name ?? '', image: offering.image_url ?? '' }
  const hostel = (offering as any)._hostel ?? { name: '', short: '' }
  const isFav = favorites.includes(offering.id)

  return (
    <motion.li variants={itemVariants} exit="exit" layout="position" className="flex items-center gap-3">
      {rank !== undefined && (
        <span className="w-5 shrink-0 text-center font-display text-[15px] font-semibold text-brand">{rank}</span>
      )}
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="relative flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-line bg-surface p-3 transition-colors hover:bg-elevated"
      >
        <button
          type="button"
          onClick={() => push({ type: 'dish', dishId: dish.id, dishName: dish.name, offeringId: offering.id })}
          className="absolute inset-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-brand"
          aria-label={`${dish.name} at ${hostel.name} ${shiftLabel(offering.shift)}, rated ${offering.rating.toFixed(1)}, ₹${offering.price}`}
        />
        <DishThumb src={dish.image} alt="" size={56} />
        <div className="pointer-events-none min-w-0 flex-1">
          <p className="truncate font-display text-[15px] font-semibold text-fg">{dish.name}</p>
          <MonoLabel className="block truncate text-fg-2">
            {hostel.short} · {shiftLabel(offering.shift)}
          </MonoLabel>
          <div className="mt-0.5 flex items-center gap-1.5">
            <RatingInline value={offering.rating} />
            <span className="text-fg-3" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[12px] text-fg-2">
              <Clock className="size-3" aria-hidden />
              {offering.serveMin} min
            </span>
          </div>
        </div>
        <div className="relative flex flex-col items-end gap-2">
          <span className="font-mono text-[15px] font-semibold text-brand"><Price value={offering.price} /></span>
          <HeartButton active={isFav} onToggle={() => toggleFavorite(offering.id)} label={dish.name} />
        </div>
      </motion.div>
    </motion.li>
  )
}
