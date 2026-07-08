import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, RefreshCw, Download, ExternalLink, CheckCircle,
  XCircle, Clock, AlertTriangle, Zap, DollarSign,
  Users, Database, ChevronDown, Sparkles,
  TrendingUp, Activity, BarChart3, Globe, Eye, X, Mail, Linkedin,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'

// ── Options ───────────────────────────────────────────────────────────────────

// Exact enum values accepted by the Apify Startup Investors actor
const FIRM_TYPES = [
  'Angel Investor',
  'Venture Capital Investor',
  'Corporate Venture Capital Investor',
  'Private Equity',
  'Accelerator',
  'Incubator',
  'Multi Family Office',
  'Single Family Office',
  'Hedge Fund',
  'Merchant Bank',
  'Venture Debt',
  'Tech Transfer Office',
  'Economic Development Organization',
  'Startup',
  'Secondary',
  'Real Estate',
  'Other',
]

const FOCUS_AREAS = [
  'Artificial Intelligence', 'Software', 'Financial Services', 'Health Care',
  'Biotechnology', 'Information Technology', 'Blockchain & Crypto', 'Education',
  'Energy', 'Sustainability', 'Data and Analytics', 'Gaming',
  'Media and Entertainment', 'Transportation', 'Real Estate', 'Food and Beverage',
  'Apps', 'Hardware', 'Science and Engineering', 'Consumer Electronics',
  'Consumer Goods', 'Commerce and Shopping', 'Advertising', 'Agriculture and Food',
  'Clothing and Apparel', 'Community and Lifestyle', 'Content and Publishing',
  'Design', 'Events', 'Government', 'Internet Services', 'Lending and Investments',
  'Manufacturing', 'Messaging and Communication', 'Mobile', 'Music and Audio',
  'Natural Resources', 'Navigation and Mapping', 'Payments', 'Platforms',
  'Privacy and Security', 'Professional Services', 'Sales and Marketing',
  'Sports', 'Travel and Tourism', 'Video', 'Administrative', 'Uncategorized', 'Other',
]

const STAGES = [
  'Pre-Seed', 'Seed', 'Series A', 'Series B',
  'Series C', 'Series D+', 'Growth Equity', 'Late Stage',
]

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Singapore',
  'United Arab Emirates', 'Germany', 'Israel', 'Canada',
]

// ── Types ─────────────────────────────────────────────────────────────────────

interface ApifyAccount {
  username: string; email: string; plan: string
  creditLimitUsd: number; creditUsedUsd: number; creditRemainingUsd: number
  maxComputeUnits: number | null; cycleStartedAt: string | null; actorTotalRuns: number
}

interface ScraperRun {
  id: string; created_at: string
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'enriching' | 'enriched' | 'importing' | 'imported'
  parameters: Record<string, unknown>
  apify_run_id: string | null; apify_run_url: string | null
  apify_compute_units: number | null
  linkedin_run_id: string | null; linkedin_run_url: string | null
  firms_fetched: number | null; contacts_extracted: number | null
  added_count: number | null; spam_count: number | null; duplicate_count: number | null
  profiles_enriched: number | null
  error_message: string | null; finished_at: string | null
}

interface DirectoryRow {
  id: string
  first_name: string; last_name: string | null
  firm_name: string | null; title: string | null
  investor_type: string | null; email: string | null
  linkedin_url: string | null; photo_url: string | null
  location_city: string | null; location_country: string | null
  firm_focus: string | null; firm_stages: string | null
  status: string
}

// ── API helper ────────────────────────────────────────────────────────────────

async function callScraper(action: string, method: 'GET' | 'POST' = 'GET', body?: unknown) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/investor-scraper?action=${action}`,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  )
  // Always try to parse JSON; if the body is empty/unreadable return a structured error
  try {
    return await res.json()
  } catch {
    return { error: `HTTP ${res.status} — ${res.statusText || 'Unknown error'}` }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export function ScraperPage() {
  const [account, setAccount]           = useState<ApifyAccount | null>(null)
  const [accountLoading, setAccLoading] = useState(true)
  const [runs, setRuns]                 = useState<ScraperRun[]>([])
  const [runsLoading, setRunsLoading]   = useState(true)

  // Form
  const [firmTypes,    setFirmTypes]    = useState<string[]>(['Angel Investor', 'Venture Capital Investor'])
  const [focusAreas,   setFocusAreas]   = useState<string[]>([])
  const [stages,       setStages]       = useState<string[]>([])
  const [countries,    setCountries]    = useState<string[]>(['India'])
  const [keyword,      setKeyword]      = useState('')
  const [maxResults,   setMaxResults]   = useState(50)
  const [skipLinkedin, setSkipLinkedin] = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [importingId,  setImportingId]  = useState<string | null>(null)
  const [viewRun,      setViewRun]      = useState<ScraperRun | null>(null)
  const [viewRows,     setViewRows]     = useState<DirectoryRow[]>([])
  const [viewLoading,  setViewLoading]  = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadAccount = useCallback(async () => {
    setAccLoading(true)
    try {
      const d = await callScraper('account')
      if (!d.error) setAccount(d)
    } finally { setAccLoading(false) }
  }, [])

  const loadRuns = useCallback(async () => {
    setRunsLoading(true)
    try {
      const d = await callScraper('runs')
      if (!d.error) setRuns(d.runs ?? [])
    } finally { setRunsLoading(false) }
  }, [])

  useEffect(() => { loadAccount(); loadRuns() }, [loadAccount, loadRuns])

  useEffect(() => {
    const active = runs.some(r => ['pending','running','enriching','importing'].includes(r.status))
    if (active) { pollRef.current = setInterval(loadRuns, 6000) }
    else { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [runs, loadRuns])

  async function startRun() {
    if (!firmTypes.length) { toast.error('Select at least one firm type'); return }
    if (!countries.length) { toast.error('Select at least one country'); return }
    setSubmitting(true)
    try {
      const d = await callScraper('start', 'POST', { firmTypes, focusAreas, stages, countries, keyword, maxResults })
      if (d.error) {
        const detail = d.details ? ` — ${String(d.details).slice(0, 120)}` : ''
        toast.error(`${d.error}${detail}`)
        return
      }
      toast.success('Scraper started! Waiting for results…')
      loadRuns()
    } catch { toast.error('Failed to start scraper') }
    finally { setSubmitting(false) }
  }

  async function enrichRun(runId: string) {
    setImportingId(runId + '_enrich')
    try {
      const d = await callScraper('enrich', 'POST', { runId })
      if (d.error) { toast.error(d.error); return }
      toast.success(`LinkedIn enrichment started for ${d.urlCount} profiles (~$${d.estCostUsd})`)
      loadRuns()
    } catch { toast.error('Enrichment failed') }
    finally { setImportingId(null) }
  }

  async function importRun(runId: string, force = false) {
    setImportingId(runId)
    try {
      const d = await callScraper('import', 'POST', { runId, forceReimport: force })
      if (d.error) { toast.error(d.error); return }
      toast.success(`Imported: ${d.added} added · ${d.enriched} enriched · ${d.spam} spam · ${d.duplicates} skipped`)
      loadRuns()
    } catch { toast.error('Import failed') }
    finally { setImportingId(null) }
  }

  async function reimportRun(runId: string) {
    setImportingId(runId + '_reset')
    try {
      const d = await callScraper('reset', 'POST', { runId })
      if (d.error) { toast.error(d.detail ? `${d.error}: ${d.detail}` : d.error); return }
    } catch { toast.error('Reset failed'); setImportingId(null); return }
    // Reset succeeded — now force-import
    setImportingId(runId)
    try {
      const d = await callScraper('import', 'POST', { runId, forceReimport: true })
      if (d.error) { toast.error(d.detail ? `${d.error}: ${d.detail}` : d.error); return }
      toast.success(`Re-imported: ${d.added} added · ${d.enriched} enriched · ${d.spam} spam · ${d.duplicates} skipped`)
      loadRuns()
    } catch { toast.error('Re-import failed') }
    finally { setImportingId(null) }
  }

  async function viewData(run: ScraperRun) {
    setViewRun(run)
    setViewLoading(true)
    setViewRows([])
    try {
      // Try filtering by scraper_run_id (requires migration 011 to be applied)
      const { data, error } = await supabase
        .from('investor_directory')
        .select('id,first_name,last_name,firm_name,title,investor_type,email,linkedin_url,photo_url,location_city,location_country,firm_focus,firm_stages,status')
        .eq('scraper_run_id', run.id)
        .order('first_name')
        .limit(200)

      if (!error && data && data.length > 0) {
        setViewRows(data as DirectoryRow[])
        return
      }

      // Fallback: column missing or no linked rows — query by import timestamp window
      const windowStart = run.created_at
      const windowEnd   = run.finished_at
        ? new Date(new Date(run.finished_at).getTime() + 60_000).toISOString()
        : new Date().toISOString()

      const { data: fallback } = await supabase
        .from('investor_directory')
        .select('id,first_name,last_name,firm_name,title,investor_type,email,linkedin_url,photo_url,location_city,location_country,firm_focus,firm_stages,status')
        .gte('imported_at', windowStart)
        .lte('imported_at', windowEnd)
        .order('imported_at', { ascending: false })
        .limit(200)

      setViewRows((fallback ?? []) as DirectoryRow[])
    } finally { setViewLoading(false) }
  }

  const hasRunning = runs.some(r => ['pending','running','enriching'].includes(r.status))
  const viewRunId  = viewRun?.id ?? null
  const creditPct  = account ? Math.min((account.creditUsedUsd / (account.creditLimitUsd || 1)) * 100, 100) : 0
  const creditColor = creditPct > 80 ? '#EF4444' : creditPct > 55 ? '#F59E0B' : '#16A34A'

  function fmtDate(s: string) {
    return new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }
  function fmtParams(p: Record<string, unknown>) {
    const ft = (p.firmTypes as string[] | undefined) ?? []
    const co = (p.countries as string[] | undefined) ?? []
    const mr = p.maxResults as number | undefined
    const parts = [
      ft.slice(0, 1).join('') + (ft.length > 1 ? ` +${ft.length - 1}` : ''),
      co.join(', '),
      mr ? `${mr} results` : '',
    ].filter(Boolean)
    return parts.join(' · ') || '—'
  }

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#0D1B2A', letterSpacing: '-0.025em', margin: 0 }}>
              Investor Scraper
            </h1>
            <p style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
              Configure the pipeline, monitor Apify credits, and import results into the directory.
            </p>
          </div>
          <button
            onClick={() => { loadAccount(); loadRuns() }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: '#fff', border: '1px solid #E2E8F0', color: '#64748B', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <RefreshCw className={`w-3.5 h-3.5 ${accountLoading || runsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* ── Apify Account Cards ────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          <AccountCard
            loading={accountLoading}
            icon={DollarSign}
            iconBg="#F0FDF4"
            iconColor="#16A34A"
            label="Credits Remaining"
            value={account ? `$${account.creditRemainingUsd.toFixed(2)}` : '—'}
            sub={account ? `of $${account.creditLimitUsd}/mo` : 'Loading…'}
          />
          <AccountCard
            loading={accountLoading}
            icon={Zap}
            iconBg="#FFFBEB"
            iconColor="#D97706"
            label="Used This Cycle"
            value={account ? `$${account.creditUsedUsd.toFixed(2)}` : '—'}
            sub={account?.cycleStartedAt ? `Since ${new Date(account.cycleStartedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
          />
          <AccountCard
            loading={accountLoading}
            icon={Activity}
            iconBg="#EFF6FF"
            iconColor="#2563EB"
            label="Plan"
            value={account?.plan ?? '—'}
            sub={account?.username ?? ''}
          />
          <AccountCard
            loading={accountLoading}
            icon={BarChart3}
            iconBg="#F5F3FF"
            iconColor="#7C3AED"
            label="Compute Units"
            value={account?.maxComputeUnits != null ? `${account.maxComputeUnits.toLocaleString()} / mo` : '—'}
            sub="free monthly allocation"
          />
        </div>

        {/* Credit progress bar */}
        {account && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Monthly credit usage</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: creditColor }}>
                ${account.creditUsedUsd.toFixed(2)} / ${account.creditLimitUsd.toFixed(2)}
              </span>
            </div>
            <div style={{ height: 6, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${creditPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', background: creditColor, borderRadius: 999 }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>
                ${account.creditRemainingUsd.toFixed(2)} remaining · resets monthly
              </p>
              {account.maxComputeUnits && (
                <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>
                  {account.maxComputeUnits.toLocaleString()} compute units / mo
                </p>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>

          {/* ── Left: Configure ──────────────────────────────────────────── */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            {/* Header */}
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles className="w-4 h-4" style={{ color: '#2563EB' }} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0D1B2A', margin: 0 }}>Configure Run</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>Set filters before scraping</p>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Firm Types */}
              <FilterGroup label="Firm Types" required>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {FIRM_TYPES.map(opt => (
                    <Chip key={opt} label={opt} active={firmTypes.includes(opt)}
                      onClick={() => setFirmTypes(t => t.includes(opt) ? t.filter(x => x !== opt) : [...t, opt])} />
                  ))}
                </div>
              </FilterGroup>

              {/* Focus Areas */}
              <FilterGroup label="Focus Areas">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {FOCUS_AREAS.map(opt => (
                    <Chip key={opt} label={opt} active={focusAreas.includes(opt)}
                      onClick={() => setFocusAreas(t => t.includes(opt) ? t.filter(x => x !== opt) : [...t, opt])} />
                  ))}
                </div>
              </FilterGroup>

              {/* Stages */}
              <FilterGroup label="Investment Stages">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {STAGES.map(opt => (
                    <Chip key={opt} label={opt} active={stages.includes(opt)}
                      onClick={() => setStages(t => t.includes(opt) ? t.filter(x => x !== opt) : [...t, opt])} />
                  ))}
                </div>
              </FilterGroup>

              {/* Countries */}
              <FilterGroup label="Countries" required>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {COUNTRIES.map(opt => (
                    <Chip key={opt} label={opt} active={countries.includes(opt)}
                      onClick={() => setCountries(t => t.includes(opt) ? t.filter(x => x !== opt) : [...t, opt])} />
                  ))}
                </div>
              </FilterGroup>

              {/* Keyword */}
              <FilterGroup label="Keyword (optional)">
                <input
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder="e.g. fintech, climate…"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0D1B2A', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.background = '#fff' }}
                  onBlur={e  => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC' }}
                />
              </FilterGroup>

              {/* Max Results */}
              <FilterGroup label={`Max Results — ${maxResults}`} sub={`Est. $${(maxResults * 0.01).toFixed(2)}–$${(maxResults * 0.04).toFixed(2)}`}>
                <input
                  type="range" min={10} max={500} step={10}
                  value={maxResults}
                  onChange={e => setMaxResults(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#2563EB' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <span style={{ fontSize: 10, color: '#94A3B8' }}>10</span>
                  <span style={{ fontSize: 10, color: '#94A3B8' }}>500</span>
                </div>
              </FilterGroup>

              {/* Skip LinkedIn toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#0D1B2A', margin: 0 }}>Skip LinkedIn</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>Faster, no photos/emails</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSkipLinkedin(v => !v)}
                  style={{
                    width: 40, height: 22, borderRadius: 999, border: 'none',
                    background: skipLinkedin ? '#2563EB' : '#CBD5E1',
                    cursor: 'pointer', position: 'relative', transition: 'background 200ms',
                    flexShrink: 0,
                  }}>
                  <span style={{
                    position: 'absolute', top: 2, width: 18, height: 18, borderRadius: '50%',
                    background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    left: skipLinkedin ? 20 : 2, transition: 'left 200ms',
                  }} />
                </button>
              </div>

              {/* Run button */}
              <button
                type="button"
                onClick={startRun}
                disabled={submitting || hasRunning}
                style={{
                  width: '100%', padding: '11px 0', borderRadius: 11, border: 'none',
                  background: submitting || hasRunning ? '#F1F5F9' : '#2563EB',
                  color:      submitting || hasRunning ? '#94A3B8'  : '#fff',
                  fontSize: 13, fontWeight: 700, cursor: submitting || hasRunning ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: submitting || hasRunning ? 'none' : '0 2px 8px rgba(37,99,235,0.25)',
                  transition: 'all 150ms',
                }}>
                {submitting
                  ? <><Spinner />Starting…</>
                  : hasRunning
                    ? <><Clock className="w-4 h-4" />Run in progress…</>
                    : <><Play className="w-4 h-4" />Run Scraper</>
                }
              </button>

            </div>
          </div>

          {/* ── Right: Run History ────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#0D1B2A', margin: 0 }}>Run History</p>
                <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>{runs.length} total runs</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94A3B8' }}>
                {hasRunning && <><Spinner small />Auto-refreshing</>}
              </div>
            </div>

            {/* Runs list */}
            {runsLoading && runs.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                Loading runs…
              </div>
            ) : runs.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: 48, textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Globe className="w-5 h-5" style={{ color: '#94A3B8' }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0D1B2A', margin: '0 0 4px' }}>No runs yet</p>
                <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Configure and start your first scraper run.</p>
              </div>
            ) : (
              <AnimatePresence>
                {runs.map((run, i) => (
                  <RunCard
                    key={run.id}
                    run={run}
                    index={i}
                    importingId={importingId}
                    onImport={importRun}
                    onReimport={reimportRun}
                    onEnrich={enrichRun}
                    onView={(run) => viewData(run)}
                    fmtDate={fmtDate}
                    fmtParams={fmtParams}
                  />
                ))}
              </AnimatePresence>
            )}

            {/* Cost footnote */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#D97706' }} />
              <p style={{ fontSize: 11, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                Typical cost: <strong>$0.004/compute unit</strong>. 50 investors ≈ $0.10–$0.50.
                LinkedIn enrichment adds ~$0.003/profile. Results land in <strong>Investors → Directory → Pending</strong>.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ── Data Viewer Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {viewRunId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}
            onClick={() => setViewRun(null)}>
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.22 }}
              style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 1100, overflow: 'hidden', boxShadow: '0 24px 60px rgba(15,23,42,0.18)' }}
              onClick={e => e.stopPropagation()}>

              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Database className="w-4 h-4" style={{ color: '#2563EB' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0D1B2A', margin: 0 }}>Imported Investors</p>
                    <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{viewLoading ? 'Loading…' : `${viewRows.length} records from this run`}</p>
                  </div>
                </div>
                <button onClick={() => setViewRun(null)}
                  style={{ padding: 8, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', cursor: 'pointer' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto', maxHeight: '65vh', overflowY: 'auto' }}>
                {viewLoading ? (
                  <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>Loading data…</div>
                ) : viewRows.length === 0 ? (
                  <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                    No records found for this run. Try re-importing.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', position: 'sticky', top: 0 }}>
                        {['Photo','Name','Title','Firm','Email','LinkedIn','Location','Focus','Status'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {viewRows.map((row, i) => (
                        <tr key={row.id} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                          {/* Photo */}
                          <td style={{ padding: '10px 14px' }}>
                            {row.photo_url ? (
                              <img src={row.photo_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E2E8F0' }}
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            ) : (
                              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#2563EB' }}>
                                {(row.first_name?.[0] ?? '?').toUpperCase()}
                              </div>
                            )}
                          </td>
                          {/* Name */}
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                            <p style={{ fontWeight: 600, color: '#0D1B2A', margin: 0 }}>{row.first_name} {row.last_name ?? ''}</p>
                          </td>
                          {/* Title */}
                          <td style={{ padding: '10px 14px', maxWidth: 160 }}>
                            <p style={{ color: '#64748B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.title ?? '—'}</p>
                          </td>
                          {/* Firm */}
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                            <p style={{ color: '#0D1B2A', fontWeight: 500, margin: 0 }}>{row.firm_name ?? '—'}</p>
                            {row.investor_type && <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>{row.investor_type}</p>}
                          </td>
                          {/* Email */}
                          <td style={{ padding: '10px 14px' }}>
                            {row.email ? (
                              <a href={`mailto:${row.email}`} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#2563EB', textDecoration: 'none', fontSize: 11 }}>
                                <Mail className="w-3 h-3" />{row.email}
                              </a>
                            ) : <span style={{ color: '#CBD5E1', fontSize: 11 }}>—</span>}
                          </td>
                          {/* LinkedIn */}
                          <td style={{ padding: '10px 14px' }}>
                            {row.linkedin_url ? (
                              <a href={row.linkedin_url} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0077B5', textDecoration: 'none', fontSize: 11, fontWeight: 600 }}>
                                <Linkedin className="w-3 h-3" />View
                              </a>
                            ) : <span style={{ color: '#CBD5E1', fontSize: 11 }}>—</span>}
                          </td>
                          {/* Location */}
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                            <span style={{ color: '#64748B' }}>{[row.location_city, row.location_country].filter(Boolean).join(', ') || '—'}</span>
                          </td>
                          {/* Focus */}
                          <td style={{ padding: '10px 14px', maxWidth: 180 }}>
                            <p style={{ color: '#64748B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                              title={row.firm_focus ?? ''}>
                              {row.firm_focus?.split(';')[0]?.split(',').slice(0, 2).join(', ') ?? '—'}
                            </p>
                          </td>
                          {/* Status */}
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                              background: row.status === 'approved' ? '#D1FAE5' : row.status === 'spam' ? '#F3F4F6' : '#DBEAFE',
                              color:      row.status === 'approved' ? '#059669' : row.status === 'spam' ? '#6B7280' : '#1D4ED8',
                            }}>
                              {row.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Modal footer */}
              <div style={{ padding: '12px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>
                  {viewRows.filter(r => r.photo_url).length} with photos · {viewRows.filter(r => r.email).length} with emails · {viewRows.filter(r => r.linkedin_url).length} with LinkedIn
                </p>
                <button onClick={() => setViewRun(null)}
                  style={{ padding: '7px 18px', borderRadius: 9, background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 12, fontWeight: 600, color: '#64748B', cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Run Card ─────────────────────────────────────────────────────────────────

function RunCard({
  run, index, importingId, onImport, onReimport, onEnrich, onView, fmtDate, fmtParams,
}: {
  run: ScraperRun; index: number; importingId: string | null
  onImport:   (id: string) => void
  onReimport: (id: string) => void
  onEnrich:   (id: string) => void
  onView:     (run: ScraperRun) => void
  fmtDate: (s: string) => string
  fmtParams: (p: Record<string, unknown>) => string
}) {
  const [expanded, setExpanded] = useState(false)

  const STATUS_MAP: Record<ScraperRun['status'], { label: string; bg: string; color: string; dot: string }> = {
    pending:   { label: 'Pending',    bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
    running:   { label: 'Running',    bg: '#EFF6FF', color: '#2563EB', dot: '#2563EB' },
    succeeded: { label: 'Ready',      bg: '#F0FDF4', color: '#16A34A', dot: '#16A34A' },
    failed:    { label: 'Failed',     bg: '#FEF2F2', color: '#DC2626', dot: '#DC2626' },
    enriching: { label: 'Enriching',  bg: '#F5F3FF', color: '#7C3AED', dot: '#7C3AED' },
    enriched:  { label: 'Enriched ✓', bg: '#EDE9FE', color: '#6D28D9', dot: '#6D28D9' },
    importing: { label: 'Importing',  bg: '#FFFBEB', color: '#D97706', dot: '#D97706' },
    imported:  { label: 'Imported',   bg: '#F0FDF4', color: '#16A34A', dot: '#16A34A' },
  }
  const STATUS = STATUS_MAP[run.status] ?? STATUS_MAP.pending
  const spin = ['running','pending','enriching','importing'].includes(run.status)
  const enrichBusy   = importingId === run.id + '_enrich'
  const importBusy   = importingId === run.id
  const reimportBusy = importingId === run.id + '_reset' || importingId === run.id

  const hasStats = run.contacts_extracted != null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>

      {/* ── Top row: status + date + params ─────────────────────────── */}
      <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>

        {/* Status icon */}
        <div style={{ position: 'relative', width: 34, height: 34, flexShrink: 0, marginTop: 1 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: STATUS.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <StatusIcon status={run.status} color={STATUS.color} />
          </div>
          {spin && <div style={{ position: 'absolute', inset: -2, borderRadius: 11, border: `2px solid ${STATUS.dot}`, borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />}
        </div>

        {/* Info block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: STATUS.bg, color: STATUS.color, letterSpacing: '0.01em' }}>
              {STATUS.label}
            </span>
            {run.profiles_enriched != null && run.profiles_enriched > 0 && (
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: '#F5F3FF', color: '#7C3AED', letterSpacing: '0.01em' }}>
                {run.profiles_enriched} enriched
              </span>
            )}
            <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 2 }}>{fmtDate(run.created_at)}</span>
          </div>
          <p style={{ fontSize: 12, color: '#64748B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 360 }}>
            {fmtParams(run.parameters)}
          </p>
        </div>

        {/* Top-right: Apify link + expand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {run.apify_run_url && (
            <a href={run.apify_run_url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 9px', borderRadius: 7, fontSize: 11, fontWeight: 500, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', textDecoration: 'none' }}>
              <ExternalLink className="w-3 h-3" />Apify
            </a>
          )}
          {(hasStats || run.error_message) && (
            <button type="button" onClick={() => setExpanded(v => !v)}
              style={{ padding: '4px 7px', borderRadius: 7, background: expanded ? '#F1F5F9' : '#F8FAFC', border: '1px solid #E2E8F0', color: '#94A3B8', cursor: 'pointer' }}>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} style={{ transition: 'transform 200ms' }} />
            </button>
          )}
        </div>
      </div>

      {/* ── Bottom row: stats + actions ─────────────────────────────── */}
      <div style={{ padding: '10px 16px 14px', borderTop: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>

        {/* Stats pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {run.contacts_extracted != null && (
            <StatPill icon={Users} value={run.contacts_extracted} label="contacts" />
          )}
          {run.added_count != null && (
            <StatPill icon={CheckCircle} value={run.added_count} label="added" accent="#16A34A" />
          )}
          {run.duplicate_count != null && run.duplicate_count > 0 && (
            <StatPill icon={XCircle} value={run.duplicate_count} label="skipped" accent="#D97706" />
          )}
          {run.apify_compute_units != null && (
            <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 2 }}>
              {run.apify_compute_units > 0 ? `~$${(run.apify_compute_units * 0.2).toFixed(3)}` : 'Free'}
            </span>
          )}
          {run.status === 'enriching' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#7C3AED' }}>
              <Spinner small />Enriching…
            </span>
          )}
          {run.status === 'importing' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#D97706' }}>
              <Spinner small />Importing…
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

          {/* Succeeded: enrich or basic import */}
          {run.status === 'succeeded' && (
            <>
              <button onClick={() => onEnrich(run.id)} disabled={enrichBusy}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: '#F5F3FF', border: '1px solid #DDD6FE', color: '#7C3AED', cursor: enrichBusy ? 'wait' : 'pointer', opacity: enrichBusy ? 0.7 : 1 }}>
                {enrichBusy ? <><Spinner small />Starting…</> : <>✦ Enrich + Import</>}
              </button>
              <button onClick={() => onImport(run.id)} disabled={importBusy}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px', borderRadius: 8, fontSize: 11, fontWeight: 500, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', cursor: importBusy ? 'wait' : 'pointer' }}>
                {importBusy ? <><Spinner small />…</> : <><Download className="w-3 h-3" />Quick Import</>}
              </button>
            </>
          )}

          {/* Enriched: import all */}
          {run.status === 'enriched' && (
            <button onClick={() => onImport(run.id)} disabled={importBusy}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: '#2563EB', border: 'none', color: '#fff', cursor: importBusy ? 'wait' : 'pointer', opacity: importBusy ? 0.7 : 1, boxShadow: '0 1px 4px rgba(37,99,235,0.2)' }}>
              {importBusy ? <><Spinner small />Importing…</> : <><Download className="w-3 h-3" />Import All</>}
            </button>
          )}

          {/* Imported */}
          {run.status === 'imported' && (
            <>
              <button onClick={() => onView(run)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', cursor: 'pointer' }}>
                <Eye className="w-3 h-3" />View Data
              </button>
              <button onClick={() => onReimport(run.id)} disabled={reimportBusy}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px', borderRadius: 8, fontSize: 11, fontWeight: 500, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', cursor: reimportBusy ? 'wait' : 'pointer', opacity: reimportBusy ? 0.7 : 1 }}>
                {reimportBusy ? <><Spinner small />…</> : <><RefreshCw className="w-3 h-3" />Re-import</>}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Expanded detail ──────────────────────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} style={{ overflow: 'hidden' }}>
            <div style={{ borderTop: '1px solid #F1F5F9', padding: '12px 16px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Firms',    val: run.firms_fetched      ?? '—', color: '#64748B' },
                { label: 'Contacts', val: run.contacts_extracted ?? '—', color: '#2563EB' },
                { label: 'Enriched', val: run.profiles_enriched  ?? '—', color: '#7C3AED' },
                { label: 'Added',    val: run.added_count        ?? '—', color: '#16A34A' },
                { label: 'Dupes',    val: run.duplicate_count    ?? '—', color: '#D97706' },
              ].map(({ label, val, color }) => (
                <div key={label}>
                  <p style={{ fontSize: 10, color: '#94A3B8', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color, margin: 0, fontFamily: 'var(--font-display)' }}>{val}</p>
                </div>
              ))}
              {run.linkedin_run_url && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end' }}>
                  <a href={run.linkedin_run_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: '#7C3AED', textDecoration: 'none', fontWeight: 600 }}>
                    LinkedIn run ↗
                  </a>
                </div>
              )}
            </div>
            {run.error_message && (
              <div style={{ padding: '8px 16px 12px', fontSize: 11, color: '#DC2626', background: '#FFF5F5' }}>
                {run.error_message}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Small primitives ──────────────────────────────────────────────────────────

function AccountCard({ loading, icon: Icon, iconBg, iconColor, label, value, sub }: {
  loading: boolean; icon: React.ElementType
  iconBg: string; iconColor: string
  label: string; value: string | number; sub?: string
}) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      {loading ? (
        <div style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: '#F1F5F9', marginBottom: 12 }} />
          <div style={{ height: 10, width: '60%', background: '#F1F5F9', borderRadius: 5, marginBottom: 8 }} />
          <div style={{ height: 22, width: '80%', background: '#F1F5F9', borderRadius: 6 }} />
        </div>
      ) : (
        <>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <Icon className="w-4 h-4" style={{ color: iconColor }} />
          </div>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#0D1B2A', margin: '0 0 2px', letterSpacing: '-0.025em', fontFamily: 'var(--font-display)' }}>{value}</p>
          {sub && <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{sub}</p>}
        </>
      )}
    </div>
  )
}

function FilterGroup({ label, required, sub, children }: {
  label: string; required?: boolean; sub?: string; children: React.ReactNode
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        {required && <span style={{ fontSize: 9, fontWeight: 700, color: '#EF4444', background: '#FEF2F2', padding: '1px 5px', borderRadius: 4 }}>required</span>}
        {sub && <span style={{ fontSize: 10, color: '#94A3B8' }}>{sub}</span>}
      </div>
      {children}
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 10px', borderRadius: 8, textAlign: 'left',
        fontSize: 11.5, fontWeight: active ? 600 : 500,
        background: active ? '#EFF6FF' : '#F8FAFC',
        border: `1.5px solid ${active ? 'rgba(37,99,235,0.3)' : '#E2E8F0'}`,
        color: active ? '#1E40AF' : '#64748B',
        cursor: 'pointer', transition: 'all 120ms',
      }}>
      <span style={{
        width: 12, height: 12, borderRadius: 3, flexShrink: 0, transition: 'all 120ms',
        background: active ? '#2563EB' : '#E2E8F0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {active && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <polyline points="1.5,4 3,6 6.5,2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </button>
  )
}

function StatPill({ icon: Icon, value, label, accent = '#64748B' }: {
  icon: React.ElementType; value: number; label: string; accent?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
      <Icon className="w-3 h-3" style={{ color: accent }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: '#0D1B2A' }}>{value}</span>
      <span style={{ fontSize: 10, color: '#94A3B8' }}>{label}</span>
    </div>
  )
}

function StatusIcon({ status, color }: { status: ScraperRun['status']; color: string }) {
  const props = { className: 'w-4 h-4', style: { color } }
  if (status === 'pending')   return <Clock      {...props} />
  if (status === 'running')   return <Activity   {...props} />
  if (status === 'succeeded') return <TrendingUp {...props} />
  if (status === 'failed')    return <XCircle    {...props} />
  if (status === 'enriching') return <Sparkles   {...props} />
  if (status === 'enriched')  return <Sparkles   {...props} />
  if (status === 'importing') return <Download   {...props} />
  if (status === 'imported')  return <Database   {...props} />
  return <Clock {...props} />
}

function Spinner({ small }: { small?: boolean }) {
  const s = small ? 12 : 16
  return (
    <div style={{
      width: s, height: s, borderRadius: '50%',
      border: `2px solid rgba(255,255,255,0.3)`,
      borderTopColor: '#fff',
      animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  )
}
