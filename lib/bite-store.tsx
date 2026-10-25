'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import React from 'react'
import {
  supabase,
  signInWithIITREmail,
  getUserFavorites,
  toggleFavorite as apiToggleFavorite,
  submitOrUpdateRating,
  getUserProfileStats,
  removeUserRating,
  getUserRatingsWithDetails,
} from '@/lib/api'

import type { Shift } from './bite-data'

export type Tab = 'food' | 'canteens' | 'favorites' | 'profile'

export type View =
  | { type: 'dish'; dishId: string; dishName?: string; offeringId?: string }
  | { type: 'canteen'; hostelId: string; shift: Shift }

export type User = { id: string; name: string; email: string; hostelId: string }

export type UserRating = { stars: number; waitMin?: number; at: number }

type Store = {
  user: User | null
  tab: Tab
  stack: View[]
  favorites: string[]
  ratings: Record<string, UserRating>
  dishDetails: Record<string, { name: string; hostel: string; shift: string; image?: string }>
  notifications: boolean
  ratingDishId: string | null
  hostelSheetOpen: boolean
  signIn: (email: string) => Promise<boolean>
  signOut: () => Promise<void>
  setTab: (t: Tab) => void
  push: (v: View) => void
  replaceTop: (v: View) => void
  back: () => void
  toggleFavorite: (offeringId: string) => void
  rate: (dishId: string, stars: number, waitMin?: number) => void
  removeRating: (dishId: string) => void
  openRating: (dishId: string | null) => void
  setNotifications: (v: boolean) => void
  setHostelSheetOpen: (v: boolean) => void
  setHostel: (hostelId: string) => void
  setDishDetails: React.Dispatch<React.SetStateAction<Record<string, { name: string; hostel: string; shift: string; image?: string }>>>
}

const StoreContext = createContext<Store | null>(null)

export function BiteStoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tab, setTabState] = useState<Tab>('food')
  const [stack, setStack] = useState<View[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [ratings, setRatings] = useState<Record<string, UserRating>>({})
  const [dishDetails, setDishDetails] = useState<Record<string, { name: string; hostel: string; shift: string; image?: string }>>({})
  const [notifications, setNotifications] = useState(true)
  const [ratingDishId, setRatingDishId] = useState<string | null>(null)
  const [hostelSheetOpen, setHostelSheetOpen] = useState(false)

  const signIn = useCallback(async (email: string): Promise<boolean> => {
    try {
      const profile = await signInWithIITREmail(email)
      if (!profile) {
        console.error('Sign-in failed: profile is null')
        return false
      }
      setUser({ id: profile.id, name: profile.full_name, email: profile.email, hostelId: (profile.bhawan || 'azad').toLowerCase() })
      setTabState('food')
      setStack([])
      // Load favorites and ratings after sign-in
      const favs = await getUserFavorites(profile.id)
      setFavorites(favs.map((i: any) => i.id))
      const stats = await getUserProfileStats(profile.id)
      const newRatings = stats.recentRatings.reduce((acc: Record<string, UserRating>, cur: any) => {
        acc[cur.menu_items.id] = { stars: cur.rating, waitMin: undefined, at: Date.now() }
        return acc
      }, {})
      setRatings(newRatings)
      // Fetch enriched dish details (name, hostel, shift, image)
      const enriched = await getUserRatingsWithDetails(profile.id)
      const detailMap: Record<string, { name: string; hostel: string; shift: string; image?: string }> = {}
      enriched.forEach((r: any) => {
        const dish = r.menu_items
        detailMap[dish.id] = { name: dish.name, hostel: dish.canteens?.bhawan ?? '', shift: dish.canteens?.shift_type ?? '', image: dish.image_url ?? '' }
      })
      setDishDetails(detailMap)
      return true
    } catch (e) {
      console.error('Sign-in failed', e)
      return false
    }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('forkrank_user')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setUser({ id: parsed.id, name: parsed.full_name, email: parsed.email, hostelId: (parsed.bhawan || 'azad').toLowerCase() })
          ; (async () => {
            const favs = await getUserFavorites(parsed.id)
            setFavorites(favs.map((i: any) => i.id))
            const stats = await getUserProfileStats(parsed.id)
            const newRatings = stats.recentRatings.reduce((acc: Record<string, UserRating>, cur: any) => {
              acc[cur.menu_items.id] = { stars: cur.rating, waitMin: undefined, at: Date.now() }
              return acc
            }, {})
            setRatings(newRatings)
            const enriched = await getUserRatingsWithDetails(parsed.id)
            const detailMap: Record<string, { name: string; hostel: string; shift: string; image?: string }> = {}
            enriched.forEach((r: any) => {
              const dish = r.menu_items
              detailMap[dish.id] = { name: dish.name, hostel: dish.canteens?.bhawan ?? '', shift: dish.canteens?.shift_type ?? '', image: dish.image_url ?? '' }
            })
            setDishDetails(detailMap)
          })()
      } catch { }
    }
  }, [])

  const signOut = useCallback(async () => {
    // 1. Synchronously disarm OAuth gate and wipe localStorage BEFORE React re-renders
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('forkrank_oauth_pending')
      localStorage.removeItem('forkrank_user')
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-') || key.includes('supabase') || key === 'forkrank_user') {
          localStorage.removeItem(key)
        }
      })
      if (window.location.hash || window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }

    // 2. Reset React state immediately so LoginView mounts cleanly
    setUser(null)
    setFavorites([])
    setRatings({})
    setDishDetails({})
    setStack([])
    setRatingDishId(null)
    setHostelSheetOpen(false)

    // 3. Clear Supabase in-memory session in the background
    try {
      if (supabase) {
        await supabase.auth.signOut({ scope: 'local' })
      }
    } catch (e) {
      console.warn('Supabase signOut error:', e)
    }
  }, [])

  const setTab = useCallback((t: Tab) => {
    setTabState(t)
    setStack([])
  }, [])

  const push = useCallback((v: View) => setStack((s) => [...s, v]), [])
  const replaceTop = useCallback((v: View) => setStack((s) => [...s.slice(0, -1), v]), [])
  const back = useCallback(() => setStack((s) => s.slice(0, -1)), [])

  const toggleFavorite = useCallback(async (id: string) => {
    if (!user) return
    const result = await apiToggleFavorite(user.id, id)
    setFavorites((f) => (result ? [id, ...f] : f.filter((x) => x !== id)))
  }, [user])

  const rate = useCallback(async (dishId: string, stars: number, waitMin?: number) => {
    if (!user) return
    await submitOrUpdateRating(user.id, dishId, stars, waitMin ?? 6)
    const stats = await getUserProfileStats(user.id)
    const newRatings = stats.recentRatings.reduce((acc: Record<string, UserRating>, cur: any) => {
      acc[cur.menu_items.id] = { stars: cur.rating, waitMin: undefined, at: Date.now() }
      return acc
    }, {})
    setRatings(newRatings)
  }, [user])

  const removeRating = useCallback(async (dishId: string) => {
    if (!user) return
    await removeUserRating(user.id, dishId)
    const stats = await getUserProfileStats(user.id)
    const newRatings = stats.recentRatings.reduce((acc: Record<string, UserRating>, cur: any) => {
      acc[cur.menu_items.id] = { stars: cur.rating, waitMin: undefined, at: Date.now() }
      return acc
    }, {})
    setRatings(newRatings)
  }, [user])

  const setHostel = useCallback(async (hostelId: string) => {
    setUser((u) => {
      if (!u) return u
      const saved = localStorage.getItem('forkrank_user')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          localStorage.setItem('forkrank_user', JSON.stringify({ ...parsed, bhawan: hostelId }))
        } catch { }
      }
      return { ...u, hostelId }
    })
    if (user && supabase) {
      await supabase.from('profiles').update({ bhawan: hostelId }).eq('id', user.id)
    }
  }, [user])

  const value = useMemo<Store>(
    () => ({
      user,
      tab,
      stack,
      favorites,
      ratings,
      dishDetails,
      notifications,
      ratingDishId,
      hostelSheetOpen,
      signIn,
      signOut,
      setTab,
      push,
      replaceTop,
      back,
      toggleFavorite,
      rate,
      removeRating,
      openRating: setRatingDishId,
      setNotifications,
      setHostelSheetOpen,
      setHostel,
      setDishDetails,
    }),
    [user, tab, stack, favorites, ratings, dishDetails, notifications, ratingDishId, hostelSheetOpen, signIn, signOut, setTab, push, replaceTop, back, toggleFavorite, rate, removeRating, setHostel, setDishDetails],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useBite() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useBite must be used within BiteStoreProvider')
  return ctx
}