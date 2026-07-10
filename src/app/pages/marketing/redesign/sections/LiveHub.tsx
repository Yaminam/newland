import { Link } from 'react-router-dom'
import { GraduationCap, CalendarDays, Newspaper, Lock, ArrowRight, Award, MapPin } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { GRANTS, EVENTS, NEWS } from '../data'
import { Magnetic } from '../Magnetic'

const EASE = [0.22, 1, 0.36, 1] as const
const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.04 } } }
const col: Variants = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } }

const NEWS_TONES = ['#2563EB', '#1D4ED8', '#1E3A8A']

function Card({ icon: Icon, label, more, children }: { icon: typeof GraduationCap; label: string; more: string; children: React.ReactNode }) {
  return (
    <motion.div variants={col}
      className="flex flex-col rounded-2xl transition-all duration-300"
      style={{ background: 'var(--rd-surface)', border: '1px solid var(--rd-border)', boxShadow: '0 2px 6px rgba(13,27,42,0.04)' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 30px 60px -30px rgba(13,27,42,0.28)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(13,27,42,0.04)' }}>
      {/* Feed header */}
      <div className="flex items-center gap-2.5 px-4 py-3.5" style={{ borderBottom: '1px solid var(--rd-border)' }}>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--rd-blue-bg)', color: 'var(--rd-blue)' }}><Icon className="h-4 w-4" /></span>
        <span className="text-[12.5px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--rd-ink)' }}>{label}</span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--rd-green)' }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--rd-green)' }} /> live
        </span>
      </div>

      <div className="flex flex-col gap-2 p-3">{children}</div>

      <div className="mt-auto flex items-center gap-1.5 px-4 pb-4 text-[12px] font-bold" style={{ color: 'var(--rd-gold)' }}>
        <Lock className="h-3.5 w-3.5" /> {more}
      </div>
    </motion.div>
  )
}

const rowStyle: React.CSSProperties = { background: 'var(--rd-surface-2)', border: '1px solid var(--rd-border)', borderRadius: 12, padding: 10 }

export function LiveHub() {
  const reduce = useReducedMotion()
  return (
    <section className="relative" style={{ background: 'var(--rd-bg)' }}>
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

        <motion.div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3"
          variants={reduce ? undefined : list} initial={reduce ? false : 'hidden'} whileInView={reduce ? undefined : 'show'} viewport={{ once: true, margin: '-60px' }}>

          {/* Grants — emblem tile + amount */}
          <Card icon={GraduationCap} label="Grants" more="+ 44 more you may qualify for">
            {GRANTS.map(g => (
              <div key={g.title} className="flex items-center gap-3" style={rowStyle}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: 'var(--rd-gold-bg)', color: 'var(--rd-gold)', border: '1px solid rgba(30,58,138,0.2)' }}>
                  <Award className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-bold" style={{ color: 'var(--rd-ink-2)' }}>{g.title}</div>
                  <div className="mt-0.5 text-[10px] font-semibold" style={{ color: g.tag === 'Open' ? 'var(--rd-green)' : 'var(--rd-red)' }}>{g.tag}</div>
                </div>
                <span className="rd-num shrink-0 text-[12.5px] font-extrabold" style={{ color: 'var(--rd-ink)' }}>{g.amount}</span>
              </div>
            ))}
          </Card>

          {/* Events — real calendar date tile */}
          <Card icon={CalendarDays} label="Events" more="+ 32 more across India">
            {EVENTS.map(e => {
              const [mon, day] = e.when.split(' ')
              return (
                <div key={e.title} className="flex items-center gap-3" style={rowStyle}>
                  <span className="flex h-10 w-10 shrink-0 flex-col overflow-hidden rounded-lg" style={{ border: '1px solid var(--rd-border-2)' }}>
                    <span className="py-0.5 text-center text-[8px] font-extrabold uppercase tracking-wider text-white" style={{ background: 'var(--rd-blue)' }}>{mon}</span>
                    <span className="rd-num flex flex-1 items-center justify-center text-[13px] font-extrabold" style={{ color: 'var(--rd-ink)', background: 'var(--rd-surface)' }}>{day}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-bold" style={{ color: 'var(--rd-ink-2)' }}>{e.title}</div>
                    <div className="mt-0.5 inline-flex items-center gap-1 text-[10px]" style={{ color: 'var(--rd-muted)' }}>
                      <MapPin className="h-2.5 w-2.5" /> {e.city}
                    </div>
                  </div>
                </div>
              )
            })}
          </Card>

          {/* News — source monogram + timestamp */}
          <Card icon={Newspaper} label="Funding news" more="Unlock the full daily feed">
            {NEWS.map((n, i) => (
              <div key={n.title} className="flex items-center gap-3" style={rowStyle}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-extrabold text-white" style={{ background: NEWS_TONES[i % NEWS_TONES.length] }}>
                  {n.title.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-[12.5px] font-bold leading-snug" style={{ color: 'var(--rd-ink-2)' }}>{n.title}</div>
                </div>
                <span className="rd-num shrink-0 text-[11px] font-semibold" style={{ color: 'var(--rd-muted-2)' }}>{n.when}</span>
              </div>
            ))}
          </Card>
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
