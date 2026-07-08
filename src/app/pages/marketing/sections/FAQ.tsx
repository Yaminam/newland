import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, MessageCircleQuestion } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const

const FAQS = [
  {
    q: 'Is FounderCentral free?',
    a: 'Free for founders. Always. We don’t charge to make introductions. That’s the whole job.',
  },
  {
    q: 'Who can join as a founder?',
    a: 'Anyone running a real company. We don’t gate by stage, traction, or geography. We do check you’re a real person and not a very ambitious bot.',
  },
  {
    q: 'How does matching actually work?',
    a: 'Investors publish a thesis: stage, cheque size, sector, geography. We rank you against it and show why every match was made. No black box, no vibes.',
  },
  {
    q: 'What happens after an investor accepts my intro?',
    a: 'You both get each other’s email. The product steps out. The conversation moves to email, where deals actually get worked.',
  },
  {
    q: 'Are there fake or scraped investor profiles?',
    a: 'Profiles are reviewed and kept current by our team. We aggregate public ecosystem data, but nothing reaches your matches until it’s checked, and anything that looks off gets pulled fast.',
  },
  {
    q: 'How long does sign-up take?',
    a: 'About 8 minutes for the one-pager, roughly one coffee. You can edit anything later.',
  },
  {
    q: 'Can investors see my profile without permission?',
    a: 'They see what you make public. Your deck, your raise size, your traction, shared only when you accept their intro request.',
  },
] as const

const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const item: Variants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } }

export function FAQ() {
  const reducedMotion = useReducedMotion()
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section id="faq" style={{ background: 'var(--surface)' }}>
      <div className="w-full px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left — heading */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <motion.p
                className="mb-4 text-[12px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: 'var(--blue)' }}
                initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                Honest answers
              </motion.p>
              <motion.h2
                className="font-bold"
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.8vw, 3.1rem)', lineHeight: 1.1, letterSpacing: '-0.028em', color: 'var(--ink)' }}
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: 0.05, ease: EASE }}
              >
                Questions worth asking.
              </motion.h2>
              <motion.p
                className="mt-5 max-w-sm text-[16px] leading-relaxed"
                style={{ color: 'var(--muted)' }}
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: 0.1, ease: EASE }}
              >
                No fine print, no fluff. If something here doesn’t answer it, we’re one message away.
              </motion.p>
              <motion.div
                className="mt-7"
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: 0.15, ease: EASE }}
              >
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 font-bold"
                  style={{ color: 'var(--blue)' }}
                >
                  <MessageCircleQuestion className="h-4 w-4" />
                  Still have a question?
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Right — divided accordion */}
          <motion.div
            className="border-t lg:col-span-7"
            style={{ borderColor: 'var(--line)' }}
            variants={list}
            initial={reducedMotion ? false : 'hidden'}
            whileInView={reducedMotion ? undefined : 'show'}
            viewport={{ once: true, margin: '-60px' }}
          >
            {FAQS.map((faq, i) => {
              const isOpen = openIdx === i
              return (
                <motion.div key={faq.q} variants={item} className="border-b" style={{ borderColor: 'var(--line)' }}>
                  <button
                    type="button"
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="group flex w-full items-center gap-4 py-6 text-left"
                  >
                    <span
                      className="shrink-0 font-bold tabular-nums transition-colors duration-200"
                      style={{ fontFamily: 'var(--font-display)', fontSize: '13px', color: isOpen ? 'var(--blue)' : 'var(--muted-2)' }}
                    >
                      0{i + 1}
                    </span>
                    <span
                      className="flex-1 font-bold transition-colors duration-200 group-hover:[color:var(--blue)]"
                      style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.05rem, 1.6vw, 1.3rem)', letterSpacing: '-0.015em', color: isOpen ? 'var(--blue)' : 'var(--ink)' }}
                    >
                      {faq.q}
                    </span>
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300"
                      style={{
                        background: isOpen ? 'var(--gradient-primary)' : 'var(--bg)',
                        color: isOpen ? '#fff' : 'var(--muted-2)',
                        border: isOpen ? 'none' : '1px solid var(--line)',
                        transform: isOpen ? 'rotate(135deg)' : 'rotate(0deg)',
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </span>
                  </button>
                  <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
                    <div className="overflow-hidden">
                      <p className="max-w-xl pb-6 pl-[34px] text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
