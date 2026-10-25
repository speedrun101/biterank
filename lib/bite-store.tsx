'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type Dispatch, type SetStateAction, type ReactNode } from 'react'
import React from 'react'
import {
  supabase,
  signInWithIITREmail,
  getUserFavorites,
  toggleFavorite as apiToggleFavorite,
  submitOrUpdateRating,
  getUserProfileStats,
  removeUserRating,
  getFoodLeaderboard,
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
  signIn: (email: string) => void
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

const SEED_FAVORITES = ['egg-roll@cautley-night', 'cold-coffee@govind-night', 'aloo-paratha@rajiv-day', 'maggi@rajendra-night']

const SEED_RATINGS: Record<string, UserRating> = {
  'egg-roll': { stars: 5, at: 5 },
  maggi: { stars: 4, at: 4 },
  'aloo-paratha': { stars: 3, at: 3 },
  chai: { stars: 4, at: 2 },
  'masala-dosa': { stars: 4, at: 1 },
}

function nameFromEmail(email: string) {
  const local = email.split('@')[0]
  if (local.toLowerCase() === 'aarav_m') return 'Aarav Mehta'
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.replace(/\d+/g, ''))
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1).toLowerCase())
    .join(' ') || 'IITR Student'
}

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
        console.error('Sign‑in failed: profile is null')
        return false
      }
      setUser({ id: profile.id, name: profile.full_name, email: profile.email, hostelId: (profile.bhawan || 'azad').toLowerCase() })
      setTabState('food')
      setStack([])
      // Load favorites and ratings after sign‑in
      const favs = await getUserFavorites(profile.id)
      setFavorites(favs.map((i: any) => i.id))
      const stats = await getUserProfileStats(profile.id);
      const newRatings = stats.recentRatings.reduce((acc: Record<string, UserRating>, cur: any) => {
        acc[cur.menu_items.id] = { stars: cur.rating, waitMin: undefined, at: Date.now() }
        return acc
      }, {})
      setRatings(newRatings);
      // Fetch enriched dish details (name, hostel, shift, image)
      const enriched = await getUserRatingsWithDetails(profile.id);
      const detailMap: Record<string, { name: string; hostel: string; shift: string; image?: string }> = {};
      enriched.forEach((r: any) => {
        const dish = r.menu_items;
        detailMap[dish.id] = { name: dish.name, hostel: dish.canteens?.bhawan ?? '', shift: dish.canteens?.shift_type ?? '', image: dish.image_url ?? '' };
      });
      setDishDetails(detailMap);
      return true
    } catch (e) {
      console.error('Sign‑in failed', e)
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
              acc[cur.menu_items.id] = { stars: cur.rating, waitMin: undefined, at: Date.now() };;
              return acc;;
            }, {});;
            setRatings(newRatings);
            // Fetch enriched dish details (name, hostel, shift)
            const enriched = await getUserRatingsWithDetails(parsed.id);
            const detailMap: Record<string, { name: string; hostel: string; shift: string; image?: string }> = {};
            enriched.forEach((r: any) => {
              const dish = r.menu_items;
              detailMap[dish.id] = { name: dish.name, hostel: dish.canteens?.bhawan ?? '', shift: dish.canteens?.shift_type ?? '', image: dish.image_url ?? '' };
            });
            setDishDetails(detailMap);

          })()
      } catch { }
    }
  }, [])
  const signOut = useCallback(async () => {
    try {
      if (supabase) {
        // Force-clear local session and revoke tokens
        await supabase.auth.signOut({ scope: 'local' })
      }
    } catch (e) {
      console.warn('Supabase signOut error:', e)
    }

    // Explicitly wipe all Supabase keys from localStorage to prevent auto-relogin loops
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach((key) => {
        if (key.includes('supabase.auth.token') || key === 'forkrank_user') {
          localStorage.removeItem(key)
        }
      })
    }

    setUser(null)
    setFavorites([])
    setRatings({})
    setDishDetails({})
    setStack([])
    setRatingDishId(null)
    setHostelSheetOpen(false)
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
      dishDetails,          // <-- expose dish details
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
      setDishDetails,       // <-- expose setter
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

