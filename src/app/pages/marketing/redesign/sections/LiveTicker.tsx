// A two-row marquee of anonymized live matches. Ambient motion right under
// the hero that reinforces the "real, live directory" story. Reuses the
// global .cc-marquee utilities from styles/index.css. Rows scroll opposite
// directions for a subtle parallax feel (Wispr-style).

const ROW_A = [
  'Seed · SaaS · Bangalore → 23 matches',
  'Pre-seed · Fintech · Mumbai → 14 matches',
  'Series A · AI / ML · Remote → 9 matches',
  'Seed · Consumer · Delhi NCR → 18 matches',
  'Pre-seed · Healthtech · Pune → 11 matches',
]
const ROW_B = [
  'Series A · SaaS · Mumbai → 16 matches',
  'Seed · Climate · Bangalore → 7 matches',
  'Pre-seed · AI / ML · Delhi NCR → 21 matches',
  'Seed · Fintech · Remote → 13 matches',
  'Pre-seed · Consumer · Pune → 8 matches',
]

function Pill({ text }: { text: string }) {
  return (
    <span className="mx-2 inline-flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2.5 text-[13.5px] font-semibold"
      style={{ background: 'var(--rd-surface)', border: '1px solid var(--rd-border)', color: 'var(--rd-ink-2)', boxShadow: '0 2px 6px rgba(13,27,42,0.04)' }}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--rd-green)', boxShadow: '0 0 0 3px var(--rd-green-bg)' }} />
      {text}
    </span>
  )
}

function Row({ items, dir }: { items: string[]; dir: 'left' | 'right' }) {
  const doubled = [...items, ...items, ...items, ...items]
  return (
    <div className={`cc-marquee ${dir === 'left' ? 'cc-marquee-left' : 'cc-marquee-right'}`}>
      <div className="cc-marquee-track py-1.5">
        {doubled.map((t, i) => <Pill key={`${t}-${i}`} text={t} />)}
      </div>
    </div>
  )
}

export function LiveTicker() {
  return (
    <section className="relative overflow-hidden" style={{ background: 'var(--rd-bg-2)', borderTop: '1px solid var(--rd-border)', borderBottom: '1px solid var(--rd-border)' }}>
      <div className="py-6">
        <div className="mb-3 flex items-center justify-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--rd-green)' }} />
          <span className="text-[11.5px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--rd-muted-2)' }}>Founders are matching right now</span>
        </div>
        <div className="flex flex-col gap-2.5">
          <Row items={ROW_A} dir="left" />
          <Row items={ROW_B} dir="right" />
        </div>
      </div>
      {/* Edge fades so pills melt into the page rather than clip */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-24" style={{ background: 'linear-gradient(90deg, var(--rd-bg-2), transparent)' }} />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-24" style={{ background: 'linear-gradient(270deg, var(--rd-bg-2), transparent)' }} />
    </section>
  )
}
