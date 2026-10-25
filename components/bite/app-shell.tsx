'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { BiteStoreProvider, useBite } from '@/lib/bite-store'
import { BottomNav } from './bottom-nav'
import { CanteenDetail } from './canteen-detail'
import { CanteensView } from './canteens-view'
import { DishDetail } from './dish-detail'
import { FavoritesView } from './favorites-view'
import { FoodView } from './food-view'
import { LoginView } from './login-view'
import { HostelSheet, ProfileView } from './profile-view'
import { RatingSheet } from './rating-sheet'

export function AppShell() {
  return (
    <BiteStoreProvider>
      <div className="relative mx-auto min-h-screen max-w-[420px] overflow-x-hidden border-x border-line/40 bg-base pb-24 text-fg">
        <Screens />
      </div>
    </BiteStoreProvider>
  )
}

function Screens() {
  const { user, tab, stack } = useBite()

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <LoginView key="login" />
      </AnimatePresence>
    )
  }

  const top = stack[stack.length - 1]
  const key = top
    ? top.type === 'dish'
      ? `dish-${top.dishId}-${top.offeringId ?? ''}`
      : `canteen-${top.hostelId}`
    : `tab-${tab}`

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onAnimationStart={() => window.scrollTo({ top: 0 })}
        >
          {top?.type === 'dish' ? (
            <DishDetail dishId={top.dishId} dishName={top.dishName} offeringId={top.offeringId} />
          ) : top?.type === 'canteen' ? (
            <CanteenDetail hostelId={top.hostelId} shift={top.shift} />
          ) : tab === 'food' ? (
            <FoodView />
          ) : tab === 'canteens' ? (
            <CanteensView />
          ) : tab === 'favorites' ? (
            <FavoritesView />
          ) : (
            <ProfileView />
          )}
        </motion.main>
      </AnimatePresence>
      <BottomNav />
      <RatingSheet />
      <HostelSheet />
    </>
  )
}
