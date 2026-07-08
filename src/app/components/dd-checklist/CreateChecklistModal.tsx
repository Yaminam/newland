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
  initialTemplateId?: string
  onCreate: (dealId: string, startupId: string, name: string, templateId?: string) => Promise<any>
}

interface DealOption {
  id: string
  startup_id: string
  company_name: string
  pipeline_stage: string | null
}

export function CreateChecklistModal({ open, onClose, templates, initialTemplateId, onCreate }: Props) {
  const { user } = useAuth()
  const [deals, setDeals] = useState<DealOption[]>([])
  const [selectedDeal, setSelectedDeal] = useState('')
  const [name, setName] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [creating, setCreating] = useState(false)
  const [loadingDeals, setLoadingDeals] = useState(false)

  useEffect(() => {
    if (!open || !user) return
    setLoadingDeals(true)
    supabase
      .from('deals')
      .select(`
        id, startup_id, pipeline_stage,
        startup:startup_applications ( company_name )
      `)
      .eq('investor_id', user.id)
      .order('updated_at', { ascending: false })
      .then(async ({ data }) => {
        if (!data) { setLoadingDeals(false); return }
        const { data: existing } = await supabase
          .from('dd_checklists')
          .select('deal_id')
          .eq('investor_id', user.id)
        const existingDealIds = new Set((existing ?? []).map((e: any) => e.deal_id))
        const available = (data as any[])
          .filter(d => !existingDealIds.has(d.id))
          .map(d => ({
            id: d.id,
            startup_id: d.startup_id,
            company_name: d.startup?.company_name ?? 'Unknown',
            pipeline_stage: d.pipeline_stage,
          }))
        setDeals(available)
        setLoadingDeals(false)
      })
  }, [open, user])

  useEffect(() => {
    if (open) {
      setSelectedDeal('')
      setName('')
      setTemplateId(initialTemplateId ?? '')
    }
  }, [open, initialTemplateId])

  useEffect(() => {
    if (selectedDeal) {
      const deal = deals.find(d => d.id === selectedDeal)
      if (deal) setName(`DD - ${deal.company_name}`)
    }
  }, [selectedDeal, deals])

  const handleCreate = async () => {
    if (!selectedDeal || !name.trim()) return
    const deal = deals.find(d => d.id === selectedDeal)
    if (!deal) return
    setCreating(true)
    const result = await onCreate(deal.id, deal.startup_id, name.trim(), templateId || undefined)
    setCreating(false)
    if (result) {
      toast.success('Checklist created')
      onClose()
    } else {
      toast.error('Failed to create checklist')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New DD Checklist"
      subtitle="Create a due diligence checklist for tracking document requirements"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreate}
            isLoading={creating}
            disabled={!selectedDeal || !name.trim()}
          >
            Create Checklist
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <ModalSelect
            label="Deal"
            value={selectedDeal}
            onChange={setSelectedDeal}
            disabled={loadingDeals}
          >
            <option value="">
              {loadingDeals ? 'Loading deals...' : 'Select a deal...'}
            </option>
            {deals.map(d => (
              <option key={d.id} value={d.id}>
                {d.company_name} {d.pipeline_stage ? `(${d.pipeline_stage})` : ''}
              </option>
            ))}
          </ModalSelect>
          {!loadingDeals && deals.length === 0 && (
            <ModalWarning>
              No deals available. All deals already have checklists or you have no deals.
            </ModalWarning>
          )}
        </div>

        <ModalInput
          label="Name"
          value={name}
          onChange={setName}
          placeholder="DD Checklist name..."
          required
        />

        <ModalSelect
          label="Template (Optional)"
          value={templateId}
          onChange={setTemplateId}
        >
          <option value="">No template (blank checklist)</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.items.length} items){t.is_system ? ' - System' : ''}
            </option>
          ))}
        </ModalSelect>
      </div>
    </Modal>
  )
}
