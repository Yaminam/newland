import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, Check, Building2, Handshake, Loader2 } from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import { Modal } from '@/app/components/ui/Modal'
import { compactNumber } from '@/app/lib/utils'
import { toast } from 'sonner'
import type { PipelineDeal } from '@/app/hooks/usePipeline'

interface StartupRow {
  id: string
  company_name: string
  sector: string | null
  stage: string | null
  funding_ask_usd: number | null
  tagline: string | null
  founder_id: string | null
}

interface IntroStartup extends StartupRow {
  intro_status: string
  intro_id: string
}

interface AddToPipelineModalProps {
  open: boolean
  onClose: () => void
  onAdd: (startupId: string) => Promise<(PipelineDeal & { _duplicate?: boolean }) | null>
  existingStartupIds: Set<string>
}

export function AddToPipelineModal({ open, onClose, onAdd, existingStartupIds }: AddToPipelineModalProps) {
  const { profile } = useAuth()
  const [search, setSearch] = useState('')
  const [introStartups, setIntroStartups] = useState<IntroStartup[]>([])
  const [allStartups, setAllStartups] = useState<StartupRow[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!profile?.id || !open) return
    setLoading(true)
    try {
      // Fetch accepted/completed intros for this investor
      const { data: intros } = await supabase
        .from('introductions')
        .select('id, startup_id, status')
        .eq('investor_id', profile.id)
        .in('status', ['accepted', 'completed'])

      const introStartupIds = (intros ?? []).map(i => i.startup_id).filter(Boolean)

      // Fetch startup details for intro'd startups
      let introStartupRows: IntroStartup[] = []
      if (introStartupIds.length > 0) {
        const { data: startups } = await supabase
          .from('startup_applications')
          .select('id, company_name, sector, stage, funding_ask_usd, tagline, founder_id')
          .in('id', introStartupIds)

        introStartupRows = (startups ?? []).map(s => {
          const intro = (intros ?? []).find(i => i.startup_id === s.id)
          return { ...s, intro_status: intro?.status ?? 'accepted', intro_id: intro?.id ?? '' }
        })
      }
      setIntroStartups(introStartupRows)

      // Fetch all startups (excluding intro'd ones to avoid duplication in the list)
      const { data: all } = await supabase
        .from('startup_applications')
        .select('id, company_name, sector, stage, funding_ask_usd, tagline, founder_id')
        .not('id', 'in', introStartupIds.length > 0 ? `(${introStartupIds.join(',')})` : '(00000000-0000-0000-0000-000000000000)')
        .order('company_name')
        .limit(200)

      setAllStartups(all ?? [])
    } catch {
      toast.error('Failed to load startups')
    } finally {
      setLoading(false)
    }
  }, [profile?.id, open])

  useEffect(() => { fetchData() }, [fetchData])

  // Reset search on close
  useEffect(() => { if (!open) setSearch('') }, [open])

  const filteredIntros = useMemo(() => {
    if (!search.trim()) return introStartups
    const q = search.toLowerCase()
    return introStartups.filter(s =>
      s.company_name?.toLowerCase().includes(q) ||
      s.sector?.toLowerCase().includes(q),
    )
  }, [introStartups, search])

  const filteredAll = useMemo(() => {
    if (!search.trim()) return allStartups
    const q = search.toLowerCase()
    return allStartups.filter(s =>
      s.company_name?.toLowerCase().includes(q) ||
      s.sector?.toLowerCase().includes(q),
    )
  }, [allStartups, search])

  const handleAdd = async (startupId: string, companyName: string) => {
    setAdding(startupId)
    try {
      const result = await onAdd(startupId)
      if (result && '_duplicate' in result && result._duplicate) {
        toast.info(`${companyName} is already in your pipeline`)
      } else if (result) {
        toast.success(`${companyName} added to pipeline`)
      }
    } catch {
      toast.error('Failed to add to pipeline')
    } finally {
      setAdding(null)
    }
  }

  const isInPipeline = (id: string) => existingStartupIds.has(id)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Startup to Pipeline"
      subtitle="Track startups you're interested in by adding them to your deal pipeline"
      size="xl"
    >
      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-2)' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by company name or sector..."
          autoFocus
          className="w-full h-10 pl-10 pr-4 text-[13px] rounded-[12px] outline-0"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
          }}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--muted)' }} />
        </div>
      ) : (
        <div className="flex flex-col gap-5 max-h-[50vh] overflow-y-auto -mx-1 px-1">
          {/* Intro'd Startups Section */}
          {filteredIntros.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Handshake className="w-3.5 h-3.5" style={{ color: 'var(--pos)' }} />
                <p
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--pos)' }}
                >
                  Intro Completed ({filteredIntros.length})
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                {filteredIntros.map((s, i) => (
                  <StartupListItem
                    key={s.id}
                    startup={s}
                    isInPipeline={isInPipeline(s.id)}
                    isAdding={adding === s.id}
                    onAdd={() => handleAdd(s.id, s.company_name)}
                    badge="intro"
                    index={i}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Startups Section */}
          {filteredAll.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Building2 className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                <p
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--muted)' }}
                >
                  All Startups ({filteredAll.length})
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                {filteredAll.map((s, i) => (
                  <StartupListItem
                    key={s.id}
                    startup={s}
                    isInPipeline={isInPipeline(s.id)}
                    isAdding={adding === s.id}
                    onAdd={() => handleAdd(s.id, s.company_name)}
                    index={i}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredIntros.length === 0 && filteredAll.length === 0 && (
            <div className="text-center py-10">
              <Building2 className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--muted-2)' }} />
              <p className="text-[13px] font-medium" style={{ color: 'var(--muted)' }}>
                {search ? 'No startups match your search' : 'No startups available'}
              </p>
              <p className="text-[12px] mt-1" style={{ color: 'var(--muted-2)' }}>
                {search ? 'Try a different search term' : 'Browse the marketplace to discover startups'}
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

/* ── Startup row item ──────────────────────────────────────────────── */

function StartupListItem({
  startup,
  isInPipeline,
  isAdding,
  onAdd,
  badge,
  index,
}: {
  startup: StartupRow
  isInPipeline: boolean
  isAdding: boolean
  onAdd: () => void
  badge?: 'intro'
  index: number
}) {
  const initial = (startup.company_name ?? '?')[0].toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3), duration: 0.2 }}
      className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-colors hover:bg-[var(--surface-2)]"
      style={{ border: '1px solid transparent' }}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 text-[13px] font-bold"
        style={{ background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid rgba(37,99,235,0.12)' }}
      >
        {initial}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink)' }}>
            {startup.company_name}
          </p>
          {badge === 'intro' && (
            <span
              className="text-[9px] font-bold px-1.5 py-[1px] rounded-full uppercase shrink-0"
              style={{ background: 'var(--pos-bg)', color: 'var(--pos)' }}
            >
              Intro'd
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {startup.sector && (
            <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{startup.sector}</span>
          )}
          {startup.sector && startup.stage && (
            <span className="text-[10px]" style={{ color: 'var(--muted-2)' }}>&middot;</span>
          )}
          {startup.stage && (
            <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{startup.stage}</span>
          )}
          {startup.funding_ask_usd != null && startup.funding_ask_usd > 0 && (
            <>
              <span className="text-[10px]" style={{ color: 'var(--muted-2)' }}>&middot;</span>
              <span
                className="text-[11px] font-semibold"
                style={{ color: 'var(--blue)', fontFamily: 'var(--font-num)' }}
              >
                Raising {compactNumber(startup.funding_ask_usd)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Add button */}
      {isInPipeline ? (
        <span
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold shrink-0"
          style={{ background: 'var(--pos-bg)', color: 'var(--pos)' }}
        >
          <Check className="w-3.5 h-3.5" />
          In Pipeline
        </span>
      ) : (
        <button
          onClick={onAdd}
          disabled={isAdding}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold shrink-0 transition-all hover:opacity-80 active:scale-[0.97] disabled:opacity-50 cursor-pointer"
          style={{ background: 'var(--blue)', color: 'white' }}
        >
          {isAdding ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          Add
        </button>
      )}
    </motion.div>
  )
}
