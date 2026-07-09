import { useRef, type ComponentType, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Target, Send, GraduationCap, CalendarDays, Newspaper, Sparkles, ArrowRight, Lock, Check } from 'lucide-react'
import { motion, useMotionValue, useSpring, useReducedMotion, type Variants } from 'framer-motion'
import { MatchRing } from '@/app/components/ui/MatchRing'

const EASE = [0.22, 1, 0.36, 1] as const
const grid: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } } }
const cell: Variants = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } }

/** Card that tilts toward the cursor and lifts on hover. */
function Tilt({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 150, damping: 15 })
  const sry = useSpring(ry, { stiffness: 150, damping: 15 })

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 6)
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 6)
  }
  const reset = () => { rx.set(0); ry.set(0) }

  return (
    <motion.div
      variants={reduce ? undefined : cell}
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      whileHover={reduce ? undefined : { y: -6 }}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── Live mini-previews. Real components, no image weight. ─────────────── */

const panel: React.CSSProperties = { background: 'var(--rd-surface-2)', border: '1px solid var(--rd-border)', borderRadius: 12, padding: 10 }
const Blur = ({ t, w }: { t: string; w: string }) => (
  <span className={`block truncate text-[11px] font-bold ${w}`} style={{ color: 'var(--rd-ink)', filter: 'blur(3.6px)', userSelect: 'none' }}>{t}</span>
)
const Row = ({ l, r, dim }: { l: string; r: string; dim?: boolean }) => (
  <div className="flex items-center justify-between gap-2 py-1.5" style={{ borderBottom: dim ? 'none' : '1px dashed var(--rd-border)' }}>
    <span className="truncate text-[11px] font-semibold" style={{ color: 'var(--rd-ink-2)' }}>{l}</span>
    <span className="rd-num shrink-0 text-[10.5px] font-semibold" style={{ color: 'var(--rd-muted-2)' }}>{r}</span>
  </div>
)

function MatchingPreview() {
  return (
    <div style={panel}>
      {[{ f: 96, n: 'Everblue Ventures', m: 'Seed · ₹2 - 8 Cr' }, { f: 93, n: 'Kavya Capital', m: 'Seed · ₹1 - 5 Cr' }].map(r => (
        <div key={r.n} className="flex items-center gap-2.5 py-1">
          <MatchRing score={r.f} size={28} />
          <div className="min-w-0 flex-1">
            <Blur t={r.n} w="w-24" />
            <div className="mt-0.5 text-[10px]" style={{ color: 'var(--rd-muted)' }}>{r.m}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function IntroPreview() {
  return (
    <div style={panel}>
      <div className="flex items-center gap-2">
        <MatchRing score={94} size={28} />
        <div className="min-w-0 flex-1"><Blur t="Meridian Angels" w="w-20" /></div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10.5px] font-bold text-white" style={{ background: 'var(--rd-grad)' }}>
        <Send className="h-3 w-3" /> Request intro
      </div>
      <div className="mt-1.5 flex items-center justify-center gap-1 text-[10px] font-bold" style={{ color: 'var(--rd-green)' }}>
        <Check className="h-3 w-3" strokeWidth={3} /> Accepted in 2 days
      </div>
    </div>
  )
}

function GrantsPreview() {
  return (
    <div style={panel}>
      <Row l="Startup India Seed" r="₹50 L" />
      <Row l="BIRAC BIG" r="₹50 L" dim />
      <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold" style={{ color: 'var(--rd-gold)' }}><Lock className="h-3 w-3" /> +44 more</div>
    </div>
  )
}

function EventsPreview() {
  return (
    <div style={panel}>
      <Row l="TiE Delhi Pitch" r="Jul 12" />
      <Row l="Demo Day Mumbai" r="Jul 18" dim />
      <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold" style={{ color: 'var(--rd-gold)' }}><Lock className="h-3 w-3" /> +32 more</div>
    </div>
  )
}

function NewsPreview() {
  return (
    <div style={panel}>
      <Row l="Everblue closes Fund IV" r="2h" />
      <Row l="Angel tax widened" r="1d" dim />
      <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold" style={{ color: 'var(--rd-gold)' }}><Lock className="h-3 w-3" /> Full feed</div>
    </div>
  )
}

interface Feature { icon: ComponentType<{ className?: string }>; title: string; body: string; span?: string; Preview: () => React.JSX.Element }

const FEATURES: Feature[] = [
  { icon: Target, title: 'Investor matching', body: 'A live, ranked shortlist against real theses. The tool you just used, with names unlocked.', span: 'md:col-span-2', Preview: MatchingPreview },
  { icon: Send, title: 'One-click warm intros', body: 'Request an intro in a tap. When they accept, you both get each other’s email.', Preview: IntroPreview },
  { icon: GraduationCap, title: 'Grants & schemes', body: 'Every active grant you may qualify for, with eligibility and deadlines.', Preview: GrantsPreview },
  { icon: CalendarDays, title: 'Events', body: 'Pitch days, demo nights and office hours across India, with RSVP.', Preview: EventsPreview },
  { icon: Newspaper, title: 'Funding news', body: 'A daily feed of who raised, who’s deploying, and what changed.', Preview: NewsPreview },
]

export function HubBento() {
  const reduce = useReducedMotion()
  return (
    <section style={{ background: 'var(--rd-surface)', borderTop: '1px solid var(--rd-border)', borderBottom: '1px solid var(--rd-border)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:py-24">
        <div className="max-w-2xl">
          <span className="rd-eyebrow mb-5">One hub</span>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.9vw, 3.2rem)', lineHeight: 1.06, letterSpacing: '-0.03em', color: 'var(--rd-ink)' }}>
            Everything a raising founder needs, in one place.
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>
            The matcher is the front door. Behind it is the whole fundraising workflow, so you stop stitching together ten browser tabs.
          </p>
        </div>

        <motion.div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3"
          variants={grid} initial={reduce ? false : 'hidden'} whileInView={reduce ? undefined : 'show'} viewport={{ once: true, margin: '-60px' }}>
          {FEATURES.map(f => {
            const Icon = f.icon
            const Preview = f.Preview
            return (
              <Tilt key={f.title} className={`h-full ${f.span ?? ''}`}>
                <div className="flex h-full flex-col" style={{ background: 'var(--rd-surface)', border: '1px solid var(--rd-border)', borderRadius: 16, boxShadow: '0 2px 6px rgba(13,27,42,0.04)', padding: 22 }}>
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'var(--rd-blue-bg)', color: 'var(--rd-blue)' }}><Icon className="h-[21px] w-[21px]" /></span>
                  <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '-0.015em', color: 'var(--rd-ink)' }}>{f.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>{f.body}</p>
                  <div className="mt-auto pt-5"><Preview /></div>
                </div>
              </Tilt>
            )
          })}

          {/* AI copilot — full-width accent tile with a live chat preview */}
          <Tilt className="md:col-span-3">
            <div className="relative grid items-center gap-6 overflow-hidden rounded-2xl p-7 md:grid-cols-[1fr_0.85fr]"
              style={{ background: 'linear-gradient(120deg,#2563EB,#1D4ED8 60%,#1E3A8A)', boxShadow: '0 24px 50px -24px rgba(37,99,235,0.55)' }}>
              <div aria-hidden className="pointer-events-none absolute" style={{ top: '-50%', right: '8%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,185,90,0.35), transparent 60%)', filter: 'blur(14px)' }} />
              <div className="relative">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}><Sparkles className="h-6 w-6" /></span>
                <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: '#fff' }}>AI copilot for your raise</h3>
                <p className="mt-2 max-w-md text-[14.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)' }}>
                  Ask who to talk to next, draft the intro note, or pressure-test your deck. Trained on the whole directory.
                </p>
                <Link to="/auth/signup" className="rd-btn mt-6 inline-flex" style={{ height: 44, padding: '0 20px', background: '#fff', color: '#1E3A8A', fontSize: '14px' }}>
                  Try it free <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Chat preview */}
              <div className="relative rounded-2xl p-3.5" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-md px-3 py-2 text-[11.5px] font-semibold" style={{ background: 'rgba(255,255,255,0.92)', color: '#0D1B2A' }}>
                  Who should I talk to next?
                </div>
                <div className="mt-2 max-w-[88%] rounded-2xl rounded-tl-md px-3 py-2 text-[11.5px] leading-relaxed" style={{ background: 'rgba(255,255,255,0.16)', color: 'rgba(255,255,255,0.95)' }}>
                  Start with your 96% fit — they led two seed rounds in vertical SaaS this quarter. Want me to draft the intro note?
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  {[0, 1, 2].map(i => <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.5)', animation: reduce ? undefined : `rdBlink 1.2s ${i * 0.2}s infinite` }} />)}
                </div>
              </div>
            </div>
          </Tilt>
        </motion.div>
      </div>
    </section>
  )
}
