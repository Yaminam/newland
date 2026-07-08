import { Link } from 'react-router-dom'
import { Check, Clock, X, ArrowRight, MoveRight } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { Magnetic } from '../Magnetic'

const EASE = [0.22, 1, 0.36, 1] as const
const stackL: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const stackR: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.25 } } }
const chip: Variants = { hidden: { opacity: 0, y: 14, filter: 'blur(4px)' }, show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: EASE } } }

const PAIN = [
  { title: '“Quick chat about your round?”', sub: 'Seen · 12 days ago · no reply' },
  { title: '“Let’s circle back in Q3”', sub: 'Narrator: they did not' },
  { title: 'Cold email #47', sub: 'Delivered. Devastatingly ignored.' },
]
const WIN = [
  { title: 'Matched to your stage', sub: '94% thesis fit' },
  { title: 'Warm intro accepted', sub: 'Both sides opted in' },
  { title: 'Reply in 2 days', sub: 'Coffee booked. Wild.' },
]

export function Transformation() {
  const reduce = useReducedMotion()
  return (
    <section className="relative" style={{ background: 'var(--rd-surface)', borderTop: '1px solid var(--rd-border)', borderBottom: '1px solid var(--rd-border)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rd-eyebrow mb-5">The shift</span>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.9vw, 3.2rem)', lineHeight: 1.06, letterSpacing: '-0.03em', color: 'var(--rd-ink)' }}>
            You know this feeling. It ends here.
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>
            Same founder, same round. The only thing that changes is who you are talking to, and whether they were ever going to reply.
          </p>
        </div>

        <div className="mt-14 grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
          {/* Before */}
          <motion.div className="rounded-3xl p-6 sm:p-7" style={{ background: 'var(--rd-red-bg)', border: '1px solid #F3D3C6' }}
            variants={reduce ? undefined : stackL} initial={reduce ? false : 'hidden'} whileInView={reduce ? undefined : 'show'} viewport={{ once: true, margin: '-70px' }}>
            <div className="mb-5 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'rgba(194,65,12,0.12)', color: 'var(--rd-red)' }}><Clock className="h-[17px] w-[17px]" /></span>
              <span className="text-[13px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--rd-red)' }}>Raising the old way</span>
            </div>
            <div className="flex flex-col gap-3">
              {PAIN.map(p => (
                <motion.div key={p.title} variants={reduce ? undefined : chip} className="flex items-start gap-3 rounded-xl bg-white/70 p-3.5" style={{ border: '1px solid #F3D3C6' }}>
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(194,65,12,0.12)', color: 'var(--rd-red)' }}><X className="h-3 w-3" strokeWidth={3} /></span>
                  <div>
                    <div className="text-[13.5px] font-semibold leading-snug" style={{ color: 'var(--rd-ink-2)' }}>{p.title}</div>
                    <div className="mt-0.5 text-[12px]" style={{ color: 'var(--rd-muted-2)' }}>{p.sub}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Arrow */}
          <motion.div className="flex items-center justify-center"
            initial={reduce ? false : { opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2, ease: EASE }}>
            <span className="flex h-12 w-12 items-center justify-center rounded-full text-white lg:h-14 lg:w-14" style={{ background: 'var(--rd-grad)', boxShadow: '0 16px 34px -12px rgba(37,99,235,0.6)' }}>
              <MoveRight className="h-6 w-6" />
            </span>
          </motion.div>

          {/* After */}
          <motion.div className="rd-lit p-6 sm:p-7"
            variants={reduce ? undefined : stackR} initial={reduce ? false : 'hidden'} whileInView={reduce ? undefined : 'show'} viewport={{ once: true, margin: '-70px' }}>
            <div className="mb-5 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: 'var(--rd-grad)' }}><Check className="h-[17px] w-[17px]" strokeWidth={2.5} /></span>
              <span className="text-[13px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--rd-blue)' }}>Raising on FounderCentral</span>
            </div>
            <div className="flex flex-col gap-3">
              {WIN.map(w => (
                <motion.div key={w.title} variants={reduce ? undefined : chip} className="flex items-start gap-3 rounded-xl p-3.5" style={{ background: 'var(--rd-surface-2)', border: '1px solid var(--rd-border)' }}>
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--rd-green-bg)', color: 'var(--rd-green)' }}><Check className="h-3 w-3" strokeWidth={3} /></span>
                  <div>
                    <div className="text-[13.5px] font-semibold leading-snug" style={{ color: 'var(--rd-ink)' }}>{w.title}</div>
                    <div className="mt-0.5 text-[12px]" style={{ color: 'var(--rd-muted)' }}>{w.sub}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="mt-12 flex justify-center">
          <Magnetic>
            <Link to="/auth/signup" className="rd-btn rd-btn-primary" style={{ height: 52, padding: '0 28px', fontSize: '15px' }}>
              Get on the right side of this
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Magnetic>
        </div>
      </div>
    </section>
  )
}
