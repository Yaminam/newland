import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const

// Photographic band. The photo loads over a navy gradient overlay, so if the
// image ever fails to load the section is still a clean, readable dark panel.
const PHOTO = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=70'

export function FoundersBand() {
  const reduce = useReducedMotion()
  return (
    <section style={{ background: '#0D1B2A' }}>
      <div
        className="relative"
        style={{
          backgroundImage: `linear-gradient(115deg, rgba(10,16,32,0.94) 0%, rgba(12,20,40,0.78) 55%, rgba(30,58,95,0.62) 100%), url(${PHOTO})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-10 lg:py-32">
          <motion.div
            className="max-w-2xl"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <span className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.14em]"
              style={{ background: 'rgba(240,185,90,0.16)', color: 'var(--rd-gold-br)', border: '1px solid rgba(240,185,90,0.28)' }}>
              Why we built this
            </span>
            <h2 className="font-bold" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.1rem, 4.4vw, 3.6rem)', lineHeight: 1.05, letterSpacing: '-0.035em', color: '#fff' }}>
              Raising shouldn’t come down to who you already know.
            </h2>
            <p className="mt-6 max-w-xl text-[16.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Warm intros used to be a privilege of the well-connected. FounderCentral opens that same door to every founder with a real company, wherever you are and whoever you know.
            </p>
            <Link to="/auth/signup" className="mt-9 inline-flex items-center gap-2 rounded-xl font-bold transition-transform"
              style={{ height: 52, padding: '0 26px', background: '#fff', color: '#0D1B2A', fontSize: '15px' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              Find my investors <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
