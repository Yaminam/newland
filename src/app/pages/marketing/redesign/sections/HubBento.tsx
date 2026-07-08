import { useRef, type ComponentType, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Target, Send, GraduationCap, CalendarDays, Newspaper, Sparkles, ArrowRight } from 'lucide-react'
import { motion, useMotionValue, useSpring, useReducedMotion, type Variants } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const
const grid: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } } }
const cell: Variants = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } }

/** Card that tilts toward the cursor and lifts on hover. */
function Tilt({ children, className, accent }: { children: ReactNode; className?: string; accent?: boolean }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 150, damping: 15 })
  const sry = useSpring(ry, { stiffness: 150, damping: 15 })

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    ry.set(px * 7)
    rx.set(-py * 7)
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

interface Feature { icon: ComponentType<{ className?: string }>; title: string; body: string; span?: string }

const FEATURES: Feature[] = [
  { icon: Target, title: 'Investor matching', body: 'A live, ranked shortlist against real theses. The tool you just used, with the names unlocked.', span: 'md:col-span-2' },
  { icon: Send, title: 'One-click warm intros', body: 'Request an intro in a tap. When they accept, you both get each other’s email.' },
  { icon: GraduationCap, title: 'Grants & schemes', body: 'Every active grant you may qualify for, with eligibility and deadlines.' },
  { icon: CalendarDays, title: 'Events', body: 'Pitch days, demo nights and office hours across India, with RSVP.' },
  { icon: Newspaper, title: 'Funding news', body: 'A daily feed of who raised, who’s deploying, and what changed.' },
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
            return (
              <Tilt key={f.title} className={`h-full ${f.span ?? ''}`}>
                <div className="flex h-full flex-col" style={{ background: 'var(--rd-surface)', border: '1px solid var(--rd-border)', borderRadius: 16, boxShadow: '0 2px 6px rgba(13,27,42,0.04)', padding: 22 }}>
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'var(--rd-blue-bg)', color: 'var(--rd-blue)' }}><Icon className="h-[21px] w-[21px]" /></span>
                  <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: '18px', letterSpacing: '-0.015em', color: 'var(--rd-ink)' }}>{f.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>{f.body}</p>
                </div>
              </Tilt>
            )
          })}

          {/* AI copilot — full-width accent tile */}
          <Tilt className="md:col-span-3">
            <div className="relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl p-7 sm:flex-row sm:items-center sm:justify-between"
              style={{ background: 'linear-gradient(120deg,#2563EB,#4F46E5 60%,#1E40AF)', boxShadow: '0 24px 50px -24px rgba(37,99,235,0.55)' }}>
              <div aria-hidden className="pointer-events-none absolute" style={{ top: '-50%', right: '8%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,185,90,0.35), transparent 60%)', filter: 'blur(14px)' }} />
              <div className="relative flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}><Sparkles className="h-6 w-6" /></span>
                <div>
                  <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: '19px', color: '#fff' }}>AI copilot for your raise</h3>
                  <p className="mt-1 max-w-lg text-[14.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)' }}>
                    Ask who to talk to next, draft the intro note, or pressure-test your deck. Trained on the whole directory.
                  </p>
                </div>
              </div>
              <Link to="/auth/signup" className="rd-btn relative shrink-0" style={{ height: 46, padding: '0 22px', background: '#fff', color: '#1E3A8A', fontSize: '14px' }}>
                Try it free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Tilt>
        </motion.div>
      </div>
    </section>
  )
}
