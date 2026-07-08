import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/app/components/ui/Modal'
import { Button } from '@/app/components/ui/Button'
import { ModalInput, ModalSelect, ModalWarning } from '@/app/components/ui/ModalField'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import type { DDTemplate } from '@/app/hooks/useDDChecklists'

interface Props {
  open: boolean
  onClose: () => void
  templates: DDTemplate[]
  onCreate: (
    dealId: string,
    startupId: string,
    name: string,
    investorId: string,
    templateId?: string,
  ) => Promise<any>
}

interface StartupInfo {
  id: string
  company_name: string
}

interface InvestorOption {
  id: string
  full_name: string | null
  company: string | null
  avatar_url: string | null
  deal_id: string | null
}

export function CreateDDChecklistModal({ open, onClose, templates, onCreate }: Props) {
  const { user } = useAuth()
  const [startup, setStartup] = useState<StartupInfo | null>(null)
  const [investors, setInvestors] = useState<InvestorOption[]>([])
  const [selectedInvestor, setSelectedInvestor] = useState('')
  const [name, setName] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load founder's startup + investors with deals
  useEffect(() => {
    if (!open || !user) return
    setLoading(true)

    supabase
      .from('startup_applications')
      .select('id, company_name')
      .eq('founder_id', user.id)
      .limit(1)
      .maybeSingle()
      .then(async ({ data: app }) => {
        if (!app) { setStartup(null); setLoading(false); return }
        setStartup(app)

        // Get investors who have deals with this startup
        const { data: deals } = await supabase
          .from('deals')
          .select('id, investor_id')
          .eq('startup_id', app.id)
          .order('updated_at', { ascending: false })

        if (deals && deals.length > 0) {
          const investorIds = [...new Set(deals.map(d => d.investor_id))]
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, company, avatar_url')
            .in('id', investorIds)
            .order('full_name', { ascending: true })

          const investorList: InvestorOption[] = (profiles ?? []).map(p => ({
            ...p,
            deal_id: deals.find(d => d.investor_id === p.id)?.id ?? null,
          }))
          setInvestors(investorList)
        } else {
          // Fallback: load all investors
          const { data: allInvestors } = await supabase
            .from('profiles')
            .select('id, full_name, company, avatar_url')
            .eq('role', 'investor')
            .order('full_name', { ascending: true })
            .limit(50)
          setInvestors((allInvestors ?? []).map(p => ({ ...p, deal_id: null })))
        }
        setLoading(false)
      })
  }, [open, user])

  useEffect(() => {
    if (open) {
      setSelectedInvestor('')
      setName('')
      setTemplateId('')
    }
  }, [open])

  // Auto-fill name when investor selected
  useEffect(() => {
    if (selectedInvestor && startup) {
      const investor = investors.find(i => i.id === selectedInvestor)
      if (investor) {
        setName(`DD - ${startup.company_name} (${investor.full_name ?? 'Investor'})`)
      }
    }
  }, [selectedInvestor, startup, investors])

  const handleCreate = async () => {
    if (!startup || !name.trim() || !selectedInvestor) return
    const investor = investors.find(i => i.id === selectedInvestor)
    if (!investor) return

    // Find or create deal
    let dealId: string | null = investor.deal_id ?? null
    if (!dealId) {
      const { data: existingDeal } = await supabase
        .from('deals')
        .select('id')
        .eq('startup_id', startup.id)
        .eq('investor_id', selectedInvestor)
        .limit(1)
        .maybeSingle()

      if (existingDeal) {
        dealId = existingDeal.id
      } else {
        const { data: newDeal, error } = await supabase
          .from('deals')
          .insert({
            startup_id: startup.id,
            investor_id: selectedInvestor,
            pipeline_stage: 'due_diligence',
          })
          .select('id')
          .single()
        if (error || !newDeal) {
          toast.error('Failed to create deal record')
          return
        }
        dealId = newDeal.id
      }
    }

    setCreating(true)
    if (!dealId) return
    const result = await onCreate(dealId, startup.id, name.trim(), selectedInvestor, templateId || undefined)
    setCreating(false)
    if (result) {
      toast.success('DD checklist created')
      onClose()
    } else {
      toast.error('Failed to create checklist')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create DD Checklist"
      subtitle="Set up a due diligence checklist for an investor reviewing your startup"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreate}
            isLoading={creating}
            disabled={!selectedInvestor || !name.trim()}
          >
            Create Checklist
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Startup info (auto-selected, shown as label) */}
        {startup && (
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-2)' }}>
              Startup
            </label>
            <div
              className="w-full h-11 px-4 flex items-center text-[13px] rounded-xl"
              style={{ background: 'var(--surface-2)', border: '1.5px solid var(--line)', color: 'var(--ink)' }}
            >
              {startup.company_name}
            </div>
          </div>
        )}

        <ModalSelect
          label="Select Investor"
          value={selectedInvestor}
          onChange={setSelectedInvestor}
          disabled={loading}
          required
        >
          <option value="">{loading ? 'Loading investors\u2026' : 'Select an investor\u2026'}</option>
          {investors.map(inv => (
            <option key={inv.id} value={inv.id}>
              {inv.full_name ?? 'Unknown'} {inv.company ? `\u2014 ${inv.company}` : ''}
            </option>
          ))}
        </ModalSelect>
        {!loading && investors.length === 0 && (
          <ModalWarning>
            No investors found. Investors will appear here once they have a deal with your startup.
          </ModalWarning>
        )}

        <ModalInput
          label="Checklist Name"
          value={name}
          onChange={setName}
          placeholder="e.g. DD - Company Name (Investor)"
          required
        />

        <ModalSelect
          label="Template (pre-fills checklist items)"
          value={templateId}
          onChange={setTemplateId}
        >
          <option value="">No template (blank checklist)</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.items.length} items){t.is_system ? ' \u2014 System' : ''}
            </option>
          ))}
        </ModalSelect>
      </div>
    </Modal>
  )
}
