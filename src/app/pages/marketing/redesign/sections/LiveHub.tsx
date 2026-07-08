import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, CalendarDays, Newspaper, Lock, ArrowRight } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { GRANTS, EVENTS, NEWS } from '../data'
import { Magnetic } from '../Magnetic'

const EASE = [0.22, 1, 0.36, 1] as const
const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.04 } } }
const col: Variants = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } }

interface Strip { icon: ComponentType<{ className?: string }>; label: string; rows: { left: string; right: string }[]; more: string }

const STRIPS: Strip[] = [
  { icon: GraduationCap, label: 'Grants', more: '+ 44 more you may qualify for', rows: GRANTS.map(g => ({ left: g.title, right: g.amount })) },
  { icon: CalendarDays, label: 'Events', more: '+ 32 more across India', rows: EVENTS.map(e => ({ left: e.title, right: e.when })) },
  { icon: Newspaper, label: 'Funding news', more: 'Unlock the full daily feed', rows: NEWS.map(n => ({ left: n.title, right: n.when })) },
]

export function LiveHub() {
  const reduce = useReducedMotion()
  return (
    <section className="relative" style={{ background: 'var(--rd-surface)', borderTop: '1px solid var(--rd-border)', borderBottom: '1px solid var(--rd-border)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:py-24">
        <div className="max-w-2xl">
          <span className="rd-eyebrow mb-5">Live on FounderCentral</span>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.9vw, 3.2rem)', lineHeight: 1.06, letterSpacing: '-0.03em', color: 'var(--rd-ink)' }}>
            Not just investors. The whole fundraising picture.
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>
            Grants, events and funding news across India, pulled live from our data. See what is out there for free. Log in to open the full lists and act on them.
          </p>
        </div>

        <motion.div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3" variants={list} initial={reduce ? false : 'hidden'} whileInView={reduce ? undefined : 'show'} viewport={{ once: true, margin: '-60px' }}>
          {STRIPS.map(strip => {
            const Icon = strip.icon
            return (
              <motion.div key={strip.label} variants={reduce ? undefined : col}
                className="flex flex-col rounded-2xl p-5 transition-all duration-300"
                style={{ background: 'var(--rd-surface)', border: '1px solid var(--rd-border)', boxShadow: '0 2px 6px rgba(13,27,42,0.04)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 30px 60px -30px rgba(13,27,42,0.28)'; e.currentTarget.style.borderColor = 'var(--rd-border-2)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(13,27,42,0.04)'; e.currentTarget.style.borderColor = 'var(--rd-border)' }}>
                <div className="mb-4 flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--rd-blue-bg)', color: 'var(--rd-blue)' }}><Icon className="h-[18px] w-[18px]" /></span>
                  <span className="text-[13px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--rd-ink)' }}>{strip.label}</span>
                </div>
                <div className="flex flex-col">
                  {strip.rows.map((r, i) => (
                    <div key={r.left} className="flex items-center justify-between gap-3 py-3" style={{ borderBottom: i < strip.rows.length - 1 ? '1px dashed var(--rd-border)' : 'none' }}>
                      <span className="truncate text-[13.5px] font-semibold" style={{ color: 'var(--rd-ink-2)' }}>{r.left}</span>
                      <span className="rd-num shrink-0 text-[12.5px] font-semibold" style={{ color: 'var(--rd-muted-2)' }}>{r.right}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold" style={{ color: 'var(--rd-gold)' }}>
                  <Lock className="h-3.5 w-3.5" />
                  {strip.more}
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        <div className="mt-10 flex justify-center">
          <Magnetic>
            <Link to="/auth/signup" className="rd-btn rd-btn-primary" style={{ height: 52, padding: '0 28px', fontSize: '15px' }}>
              Unlock grants, events and the funding feed
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Magnetic>
        </div>
      </div>
    </section>
  )
}
