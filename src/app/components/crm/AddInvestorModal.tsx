import { useState, useCallback } from 'react'
import { Modal } from '@/app/components/ui/Modal'
import { Button } from '@/app/components/ui/Button'
import { ModalInput } from '@/app/components/ui/ModalField'
import { Search, UserPlus } from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { toast } from 'sonner'
import { type CRMStageKey } from '@/app/hooks/useCRM'

interface AddInvestorModalProps {
  open: boolean
  onClose: () => void
  onAdd: (contact: {
    display_name: string
    firm_name?: string
    email?: string
    linkedin_url?: string
    investor_user_id?: string
    source?: string
    stage?: CRMStageKey
  }) => Promise<any>
}

interface SearchResult {
  id: string
  first_name: string | null
  last_name: string | null
  company: string | null
  avatar_url: string | null
}

export function AddInvestorModal({ open, onClose, onAdd }: AddInvestorModalProps) {
  const [tab, setTab] = useState<'search' | 'manual'>('search')
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState(false)

  // Manual form
  const [name, setName] = useState('')
  const [firm, setFirm] = useState('')
  const [email, setEmail] = useState('')
  const [linkedin, setLinkedin] = useState('')

  const handleSearch = useCallback(async (q: string) => {
    setSearch(q)
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, company, avatar_url')
      .eq('role', 'investor')
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,company.ilike.%${q}%`)
      .limit(10)
    setResults(data ?? [])
    setSearching(false)
  }, [])

  const handleSelectPlatformInvestor = async (investor: SearchResult) => {
    setAdding(true)
    const displayName = [investor.first_name, investor.last_name].filter(Boolean).join(' ') || 'Unknown'
    const result = await onAdd({
      display_name: displayName,
      firm_name: investor.company ?? undefined,
      investor_user_id: investor.id,
      source: 'marketplace',
    })
    setAdding(false)
    if (result) {
      toast.success(`${displayName} added to CRM`)
      handleReset()
      onClose()
    }
  }

  const handleAddManual = async () => {
    if (!name.trim()) return
    setAdding(true)
    const result = await onAdd({
      display_name: name.trim(),
      firm_name: firm.trim() || undefined,
      email: email.trim() || undefined,
      linkedin_url: linkedin.trim() || undefined,
      source: 'manual',
    })
    setAdding(false)
    if (result) {
      toast.success(`${name.trim()} added to CRM`)
      handleReset()
      onClose()
    }
  }

  const handleReset = () => {
    setSearch('')
    setResults([])
    setName('')
    setFirm('')
    setEmail('')
    setLinkedin('')
    setTab('search')
  }

  return (
    <Modal
      open={open}
      onClose={() => { handleReset(); onClose() }}
      title="Add Investor"
      subtitle="Search the marketplace or add an external investor"
      size="lg"
      footer={
        tab === 'manual' ? (
          <>
            <Button variant="secondary" size="sm" onClick={() => { handleReset(); onClose() }}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddManual} isLoading={adding} disabled={!name.trim()}>
              Add Investor
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-2)' }}>
          {[
            { key: 'search' as const, label: 'Search Platform', icon: Search },
            { key: 'manual' as const, label: 'Add Manually', icon: UserPlus },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-medium rounded-[10px] transition-all cursor-pointer"
              style={{
                background: tab === t.key ? 'var(--surface)' : 'transparent',
                color: tab === t.key ? 'var(--ink)' : 'var(--muted)',
                boxShadow: tab === t.key ? 'var(--sh-1)' : 'none',
              }}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'search' && (
          <>
            <ModalInput
              value={search}
              onChange={handleSearch}
              placeholder="Search by name or firm\u2026"
              icon={<Search className="w-4 h-4" />}
              autoFocus
            />

            {searching && (
              <div className="py-8 text-center">
                <div className="w-5 h-5 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}

            {!searching && results.length > 0 && (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {results.map(r => {
                  const displayName = [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Unknown'
                  const initial = displayName[0]?.toUpperCase() ?? '?'
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleSelectPlatformInvestor(r)}
                      disabled={adding}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left hover:bg-[var(--surface-2)] cursor-pointer active:scale-[0.99]"
                    >
                      {r.avatar_url ? (
                        <img src={r.avatar_url} alt={displayName} className="w-9 h-9 rounded-full shrink-0 object-cover" />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold"
                          style={{ background: 'color-mix(in srgb, var(--blue) 12%, transparent)', color: 'var(--blue)' }}
                        >
                          {initial}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink)' }}>
                          {displayName}
                        </p>
                        {r.company && (
                          <p className="text-[11px] truncate" style={{ color: 'var(--muted)' }}>
                            {r.company}
                          </p>
                        )}
                      </div>
                      <UserPlus className="w-4 h-4 shrink-0" style={{ color: 'var(--blue)' }} />
                    </button>
                  )
                })}
              </div>
            )}

            {!searching && search.length >= 2 && results.length === 0 && (
              <div className="text-center py-8">
                <p className="text-[13px]" style={{ color: 'var(--muted-2)' }}>
                  No investors found. Try adding manually.
                </p>
              </div>
            )}
          </>
        )}

        {tab === 'manual' && (
          <div className="space-y-4">
            <ModalInput
              label="Name"
              value={name}
              onChange={setName}
              placeholder="Investor name"
              required
            />
            <ModalInput
              label="Firm"
              value={firm}
              onChange={setFirm}
              placeholder="Fund or firm name"
            />
            <div className="grid grid-cols-2 gap-3">
              <ModalInput
                label="Email"
                value={email}
                onChange={setEmail}
                placeholder="investor@firm.com"
                type="email"
              />
              <ModalInput
                label="LinkedIn"
                value={linkedin}
                onChange={setLinkedin}
                placeholder="linkedin.com/in/..."
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
