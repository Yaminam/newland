import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, ArrowRight, MoveRight, Clock } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { MatchRing } from '@/app/components/ui/MatchRing'
import { Magnetic } from '../Magnetic'

const EASE = [0.22, 1, 0.36, 1] as const
const stackL: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const stackR: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.25 } } }
const chip: Variants = { hidden: { opacity: 0, y: 14, filter: 'blur(4px)' }, show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: EASE } } }

/** App-window frame so both sides read as real product/inbox screens. */
function Frame({ title, tone, children }: { title: string; tone: 'bad' | 'good'; children: ReactNode }) {
  const bad = tone === 'bad'
  return (
    <div className="overflow-hidden rounded-3xl" style={{ background: 'var(--rd-surface)', border: `1px solid ${bad ? '#DDE3EC' : 'var(--rd-border)'}`, boxShadow: bad ? '0 20px 44px -28px rgba(100,116,139,0.35)' : '0 30px 64px -30px rgba(37,99,235,0.4)' }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${bad ? '#DDE3EC' : 'var(--rd-border)'}`, background: bad ? 'var(--rd-red-bg)' : 'var(--rd-surface-2)' }}>
        <span className="flex gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: '#BFDBFE' }} /><i className="h-2.5 w-2.5 rounded-full" style={{ background: '#60A5FA' }} /><i className="h-2.5 w-2.5 rounded-full" style={{ background: '#2563EB' }} /></span>
        <span className="ml-1.5 text-[12px] font-bold" style={{ color: bad ? 'var(--rd-red)' : 'var(--rd-ink)', fontFamily: 'var(--font-display)' }}>{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

const Blur = ({ t, w }: { t: string; w: string }) => (
  <span className={`truncate text-[11px] font-semibold ${w}`} style={{ color: 'var(--rd-muted)', filter: 'blur(3.6px)', userSelect: 'none' }}>{t}</span>
)

const SENT = [
  { subject: 'Quick chat about our seed round?', to: 'partner@fund.vc', status: 'Seen 12d ago' },
  { subject: 'Following up on my last note', to: 'invest@capital.in', status: 'No reply' },
  { subject: 'Re: Re: Following up', to: 'hello@angels.co', status: 'Ignored' },
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
          {/* Before — the sent folder nobody answered */}
          <motion.div variants={reduce ? undefined : stackL} initial={reduce ? false : 'hidden'} whileInView={reduce ? undefined : 'show'} viewport={{ once: true, margin: '-70px' }}>
            <Frame title="Sent · no reply" tone="bad">
              <div className="flex flex-col gap-2">
                {SENT.map(m => (
                  <motion.div key={m.subject} variants={reduce ? undefined : chip} className="flex items-start gap-2.5 rounded-xl p-2.5" style={{ background: 'var(--rd-red-bg)', border: '1px solid #DDE3EC' }}>
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(100,116,139,0.12)', color: 'var(--rd-red)' }}><X className="h-3 w-3" strokeWidth={3} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-bold" style={{ color: 'var(--rd-ink-2)' }}>{m.subject}</div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px]" style={{ color: 'var(--rd-muted-2)' }}>To:</span>
                        <Blur t={m.to} w="w-24" />
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-bold" style={{ background: 'rgba(100,116,139,0.1)', color: 'var(--rd-red)' }}>
                      <Clock className="h-2.5 w-2.5" /> {m.status}
                    </span>
                  </motion.div>
                ))}
              </div>
              <motion.div variants={reduce ? undefined : chip} className="mt-3 text-center text-[11.5px] font-bold" style={{ color: 'var(--rd-red)' }}>
                0 of 47 cold emails replied
              </motion.div>
            </Frame>
          </motion.div>

          {/* Arrow */}
          <motion.div className="flex items-center justify-center"
            initial={reduce ? false : { opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2, ease: EASE }}>
            <span className="flex h-12 w-12 items-center justify-center rounded-full text-white lg:h-14 lg:w-14" style={{ background: 'var(--rd-grad)', boxShadow: '0 16px 34px -12px rgba(37,99,235,0.6)' }}>
              <MoveRight className="h-6 w-6" />
            </span>
          </motion.div>

          {/* After — a matched, accepted intro */}
          <motion.div variants={reduce ? undefined : stackR} initial={reduce ? false : 'hidden'} whileInView={reduce ? undefined : 'show'} viewport={{ once: true, margin: '-70px' }}>
            <Frame title="FounderCentral" tone="good">
              <motion.div variants={reduce ? undefined : chip} className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: 'var(--rd-surface-2)', border: '1px solid var(--rd-border)' }}>
                <MatchRing score={94} size={36} />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-bold" style={{ color: 'var(--rd-ink)', filter: 'blur(4px)', userSelect: 'none' }}>Everblue Ventures</span>
                  <div className="mt-0.5 text-[10.5px]" style={{ color: 'var(--rd-muted)' }}>Seed · SaaS · ₹2 - 8 Cr</div>
                </div>
              </motion.div>

              <motion.div variants={reduce ? undefined : chip} className="mt-2 flex items-center gap-2 rounded-xl p-2.5" style={{ background: 'var(--rd-green-bg)', border: '1px solid rgba(37,99,235,0.22)' }}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--rd-green)', color: '#fff' }}><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
                <span className="text-[12px] font-bold" style={{ color: 'var(--rd-green)' }}>Intro accepted · emails exchanged</span>
              </motion.div>

              <motion.div variants={reduce ? undefined : chip} className="mt-2 rounded-xl rounded-tl-md p-3 text-[12px] leading-relaxed" style={{ background: 'var(--rd-surface-2)', border: '1px solid var(--rd-border)', color: 'var(--rd-ink-2)' }}>
                “Happy to connect. Free for a call Thursday?”
              </motion.div>

              <motion.div variants={reduce ? undefined : chip} className="mt-3 text-center text-[11.5px] font-bold" style={{ color: 'var(--rd-green)' }}>
                Replied in 2 days
              </motion.div>
            </Frame>
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
