'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Utensils } from 'lucide-react'
import { useBite } from '@/lib/bite-store'
import { supabase } from '@/lib/api'
import { MonoLabel } from './primitives'

const IITR_EMAIL = /^[^\s@]+@([a-z0-9-]+\.)*iitr\.ac\.in$/i

export function LoginView() {
  const { signIn } = useBite()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Listen for Google OAuth redirect & verify @*.iitr.ac.in domain
  useEffect(() => {
    if (!supabase) return
    let mounted = true
    let processing = false

    // 0. Check if Supabase rejected a non-IITR email via the DB trigger in URL params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search || window.location.hash.replace('#', '?'))
      const errDesc = params.get('error_description')
      if (errDesc) {
        setError('Access restricted exclusively to IIT Roorkee (@iitr.ac.in) email accounts.')
        window.history.replaceState({}, document.title, window.location.pathname)
      }

      // Stop auto-relogin if the user just clicked Log Out
      if (sessionStorage.getItem('forkrank_just_signed_out') === 'true') {
        return
      }
    }

    async function handleOAuthSession(email: string | undefined) {
      if (!email || !mounted || processing) return
      if (typeof window !== 'undefined' && sessionStorage.getItem('forkrank_just_signed_out') === 'true') {
        return
      }
      processing = true
      const cleanEmail = email.trim().toLowerCase()

      if (!IITR_EMAIL.test(cleanEmail)) {
        await supabase.auth.signOut()
        if (mounted) {
          setError(`Access denied: "${cleanEmail}" is not an @iitr.ac.in institute email.`)
          setLoading(false)
        }
        processing = false
        return
      }

      if (mounted) setLoading(true)
      const ok = await signIn(cleanEmail)
      if (!ok && mounted) {
        setError('Sign-in failed – please try again or check network')
        setLoading(false)
      }
      processing = false
    }

    // 1. Check if returning from Google OAuth redirect right now
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session?.user?.email) {
        if (typeof window !== 'undefined' && window.location.hash) {
          window.history.replaceState({}, document.title, window.location.pathname)
        }
        handleOAuthSession(session.user.email)
      }
    })

    // 2. Only listen for explicit SIGNED_IN events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        handleOAuthSession(session.user.email)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [signIn])

  async function handleGoogleLogin() {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('forkrank_just_signed_out')
    }
    if (!supabase) {
      setError('Database client not initialized – check environment variables')
      return
    }
    setError('')
    setLoading(true)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        queryParams: {
          prompt: 'select_account', // Always opens account picker so user can pick their IITR account
        },
      },
    })

    if (oauthError) {
      setError(oauthError.message || 'Could not start Google Sign-In')
      setLoading(false)
    }
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -8 }}
      className="relative flex min-h-screen flex-col overflow-hidden px-5 pb-10"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[440px] -translate-x-1/2 rounded-full bg-brand/35 blur-[110px]"
        animate={{ x: ['-50%', '-38%', '-60%', '-50%'], y: [0, 30, 10, 0], opacity: [0.7, 0.9, 0.6, 0.7] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-1/2 size-64 rounded-full bg-brand/10 blur-[90px]"
        animate={{ y: [0, -40, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative pt-28">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-brand text-brand-on">
          <Utensils className="size-8" aria-hidden />
        </div>
        <h1 className="mt-5 font-display text-[32px] font-bold leading-tight text-fg">Bite Rank</h1>
        <p className="mt-2 max-w-[300px] text-[14px] leading-relaxed text-fg-2">
          Every plate on campus, ranked by the people who eat it.
        </p>
      </div>

      <div className="relative mt-16 rounded-3xl border border-line bg-surface/90 p-5 backdrop-blur">
        <MonoLabel className="block text-center text-[13px] text-brand">Verified Campus Access</MonoLabel>
        <h2 className="mt-2 text-center font-display text-[18px] font-semibold text-fg">
          Sign in with your IITR Google Account
        </h2>
        <p className="mt-1 text-center text-[12px] text-fg-3">
          Restricted to @iitr.ac.in &amp; department subdomains
        </p>

        {error && (
          <motion.p
            id="email-error"
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-xl border border-rose/40 bg-rose/10 px-3 py-2 text-center text-[13px] text-rose"
          >
            {error}
          </motion.p>
        )}

        <motion.button
          type="button"
          disabled={loading}
          onClick={handleGoogleLogin}
          whileTap={{ scale: 0.98 }}
          className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-brand py-4 font-display text-[15px] font-semibold text-brand-on disabled:opacity-60"
        >
          {/* Google G Icon */}
          <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M21.35 11.1h-9.17v2.73h6.51c-.33 1.81-1.5 3.34-3.2 4.37v3.62h5.18c3.03-2.79 4.78-6.9 4.78-11.82 0-.8-.08-1.57-.23-2.3z"
            />
            <path
              fill="currentColor"
              d="M12.18 22c4.32 0 7.95-1.43 10.6-3.88l-5.18-3.62c-1.43.96-3.26 1.53-5.42 1.53-4.17 0-7.7-2.81-8.96-6.6H-2.1v3.73C.54 18.4 5.94 22 12.18 22z"
            />
          </svg>
          {loading ? 'Verifying IITR Account...' : 'Continue with IITR Google'}
        </motion.button>

        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('forkrank_just_signed_out')
            }
            signIn('aarav_m@iitr.ac.in')
          }}
          className="mt-3 w-full text-center text-[13px] text-fg-3 hover:text-fg-2"
        >
          Try the demo account
        </button>
      </div>
    </motion.main>
  )
}