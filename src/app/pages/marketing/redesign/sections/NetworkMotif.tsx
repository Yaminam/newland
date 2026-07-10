import { Rocket, Landmark, Building2, Network, Handshake } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { TONE } from '../audiences'

const EASE = [0.22, 1, 0.36, 1] as const

/** A node on the graph. Positioned by percentage so it lines up with the SVG. */
function Node({ x, y, icon: Icon, label, sub, c, bg, br, delay }: {
  x: string; y: string; icon: typeof Rocket; label: string; sub: string
  c: string; bg: string; br: string; delay: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className="absolute z-10 flex flex-col items-center"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
      initial={reduce ? false : { opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full sm:h-16 sm:w-16"
        style={{ background: 'var(--rd-surface)', border: `1.5px solid ${br}`, boxShadow: '0 12px 30px -14px rgba(13,27,42,0.35)' }}>
        {/* pulsing ring */}
        <span aria-hidden className="rd-ring absolute inset-0 rounded-full" style={{ border: `2px solid ${c}`, animationDelay: `${delay}s` }} />
        <Icon className="h-6 w-6 sm:h-7 sm:w-7" style={{ color: c }} />
      </span>
      <span className="mt-2.5 whitespace-nowrap text-[12.5px] font-bold sm:text-[13.5px]" style={{ color: 'var(--rd-ink)' }}>{label}</span>
      <span className="hidden whitespace-nowrap text-[11px] sm:block" style={{ color: 'var(--rd-muted-2)' }}>{sub}</span>
      <span aria-hidden className="absolute -z-10 h-20 w-20 rounded-full" style={{ background: bg, filter: 'blur(14px)' }} />
    </motion.div>
  )
}

export function NetworkMotif() {
  const reduce = useReducedMotion()
  const F = TONE.founders, I = TONE.investors, C = TONE.incubators

  return (
    <section style={{ background: 'var(--rd-surface)', borderTop: '1px solid var(--rd-border)', borderBottom: '1px solid var(--rd-border)' }}>
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rd-eyebrow mb-5">One network</span>
          <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.9vw, 3.2rem)', lineHeight: 1.06, letterSpacing: '-0.03em', color: 'var(--rd-ink)' }}>
            Three sides. One handshake.
          </h2>
          <p className="mt-5 text-[16px] leading-relaxed" style={{ color: 'var(--rd-muted)' }}>
            Founders find investors. Investors find deal flow. Programs move a whole cohort at once. Nothing travels between them until both sides say yes.
          </p>
        </div>

        {/* The graph */}
        <div className="relative mx-auto mt-14 w-full max-w-3xl" style={{ aspectRatio: '4 / 3' }}>
          <div className="relative h-full w-full sm:aspect-[16/10]">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id="lnkF" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="lnkI" x1="1" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B7791F" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#B7791F" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="lnkC" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#12885A" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#12885A" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="lnkArc" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="50%" stopColor="#D69B34" />
                  <stop offset="100%" stopColor="#B7791F" />
                </linearGradient>
              </defs>

              {/* founder → hub */}
              <path d="M14,26 Q32,36 50,50" fill="none" stroke="url(#lnkF)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" className={reduce ? undefined : 'rd-link'} />
              {/* investor → hub */}
              <path d="M86,26 Q68,36 50,50" fill="none" stroke="url(#lnkI)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" className={reduce ? undefined : 'rd-link'} style={{ animationDelay: '0.4s' }} />
              {/* incubator → hub */}
              <path d="M50,88 Q50,70 50,50" fill="none" stroke="url(#lnkC)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" className={reduce ? undefined : 'rd-link'} style={{ animationDelay: '0.8s' }} />
              {/* the warm intro: founder ↔ investor, arcing over the top */}
              <path d="M14,26 Q50,-4 86,26" fill="none" stroke="url(#lnkArc)" strokeWidth="2" strokeOpacity="0.5" vectorEffect="non-scaling-stroke" className={reduce ? undefined : 'rd-link rd-link-slow'} />
            </svg>

            {/* Hub */}
            <motion.div className="absolute z-20 flex flex-col items-center" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
              initial={reduce ? false : { opacity: 0, scale: 0.7 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: EASE }}>
              <span className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full text-white sm:h-20 sm:w-20"
                style={{ background: 'var(--rd-grad)', boxShadow: '0 20px 44px -16px rgba(37,99,235,0.7)' }}>
                <span aria-hidden className="rd-ring absolute inset-0 rounded-full" style={{ border: '2px solid var(--rd-blue)' }} />
                <Network className="h-8 w-8 sm:h-9 sm:w-9" />
              </span>
              <span className="mt-3 whitespace-nowrap text-[13px] font-bold sm:text-[14px]" style={{ color: 'var(--rd-ink)', fontFamily: 'var(--font-display)' }}>FounderCentral</span>
            </motion.div>

            <Node x="14%" y="26%" icon={Rocket} label="Founders" sub="raising a round" c={F.c} bg={F.bg} br={F.br} delay={0.15} />
            <Node x="86%" y="26%" icon={Landmark} label="Investors" sub="deploying capital" c={I.c} bg={I.bg} br={I.br} delay={0.3} />
            <Node x="50%" y="88%" icon={Building2} label="Incubators" sub="moving a cohort" c={C.c} bg={C.bg} br={C.br} delay={0.45} />
          </div>
        </div>

        {/* The rule that governs every edge in the graph */}
        <motion.div className="mx-auto mt-10 flex max-w-xl items-center justify-center gap-2.5 rounded-2xl px-5 py-3.5"
          style={{ background: 'var(--rd-surface-2)', border: '1px solid var(--rd-border)' }}
          initial={reduce ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.5, ease: EASE }}>
          <Handshake className="h-4 w-4 shrink-0" style={{ color: 'var(--rd-blue)' }} />
          <span className="text-center text-[13.5px] font-semibold" style={{ color: 'var(--rd-ink-2)' }}>
            Every introduction needs both sides to say yes. No cold contact, ever.
          </span>
        </motion.div>
      </div>
    </section>
  )
}
