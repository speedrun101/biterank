'use client'

import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Mail, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBite } from '@/lib/bite-store'
import { MonoLabel } from './primitives'

const IITR_EMAIL = /^[^\s@]+@([a-z0-9-]+\.)*iitr\.ac\.in$/i

export function LoginView() {
  const { signIn } = useBite()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const value = email.trim()
    if (!IITR_EMAIL.test(value)) {
      setError('Use your institute email ending in iitr.ac.in')
      return
    }
    ;(async () => {
      const ok = await signIn(value)
      if (!ok) {
        setError('Sign‑in failed – please try again or check network')
      }
    })()
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

      <form
        onSubmit={onSubmit}
        noValidate
        className="relative mt-16 rounded-3xl border border-line bg-surface/90 p-5 backdrop-blur"
      >
        <MonoLabel className="block text-center text-[13px] text-brand">Sign in</MonoLabel>
        <h2 className="mt-2 font-display text-[18px] font-semibold text-fg">Use your institute email</h2>
        <label
          className={cn(
            'mt-4 flex items-center gap-3 rounded-2xl border bg-base px-4 py-3.5 transition-colors focus-within:border-brand',
            error ? 'border-rose' : 'border-brand/60',
          )}
        >
          <Mail className="size-4 shrink-0 text-brand" aria-hidden />
          <span className="sr-only">Institute email</span>
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError('')
            }}
            placeholder="yourname@iitr.ac.in"
            aria-invalid={!!error}
            aria-describedby={error ? 'email-error' : undefined}
            className="min-w-0 flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-fg-3"
          />
        </label>
        {error && (
          <motion.p
            id="email-error"
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-[13px] text-rose"
          >
            {error}
          </motion.p>
        )}
        <motion.button
          type="submit"
          whileTap={{ scale: 0.98 }}
          className="mt-4 w-full rounded-2xl bg-brand py-4 font-display text-[15px] font-semibold text-brand-on"
        >
          Continue with IITR email
        </motion.button>
        <button
          type="button"
          onClick={() => signIn('aarav_m@iitr.ac.in')}
          className="mt-3 w-full text-center text-[13px] text-fg-3 hover:text-fg-2"
        >
          Try the demo account
        </button>
      </form>
    </motion.main>
  )
}
