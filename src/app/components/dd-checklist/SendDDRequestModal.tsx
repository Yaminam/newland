import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/app/components/ui/Modal'
import { Button } from '@/app/components/ui/Button'
import { ModalInput, ModalSelect, ModalTextarea, ModalWarning } from '@/app/components/ui/ModalField'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'
import type { DDTemplate } from '@/app/hooks/useDDChecklists'

interface Props {
  open: boolean
  onClose: () => void
  templates: DDTemplate[]
  initialTemplateId?: string
  onSend: (
    dealId: string | null,
    startupId: string,
    founderId: string,
    name: string,
    templateId?: string,
    message?: string,
  ) => Promise<any>
}

interface DealOption {
  id: string
  startup_id: string
  founder_id: string
  company_name: string
  pipeline_stage: string | null
}

export function SendDDRequestModal({ open, onClose, templates, initialTemplateId, onSend }: Props) {
  const { user } = useAuth()
  const [deals, setDeals] = useState<DealOption[]>([])
  const [selectedDeal, setSelectedDeal] = useState('')
  const [name, setName] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingDeals, setLoadingDeals] = useState(false)

  useEffect(() => {
    if (!open || !user) return
    setLoadingDeals(true)
    supabase
      .from('deals')
      .select(`
        id, startup_id, pipeline_stage,
        startup:startup_applications ( company_name, founder_id )
      `)
      .eq('investor_id', user.id)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (!data) { setLoadingDeals(false); return }
        const available = (data as any[])
          .filter(d => d.startup?.founder_id)
          .map(d => ({
            id: d.id,
            startup_id: d.startup_id,
            founder_id: d.startup.founder_id,
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
      setMessage('')
    }
  }, [open, initialTemplateId])

  useEffect(() => {
    if (selectedDeal) {
      const deal = deals.find(d => d.id === selectedDeal)
      if (deal) setName(`DD - ${deal.company_name}`)
    }
  }, [selectedDeal, deals])

  const handleSend = async () => {
    const deal = deals.find(d => d.id === selectedDeal)
    if (!deal || !name.trim()) return
    setSending(true)
    const result = await onSend(
      deal.id,
      deal.startup_id,
      deal.founder_id,
      name.trim(),
      templateId || undefined,
      message.trim() || undefined,
    )
    setSending(false)
    if (result) {
      toast.success('DD request sent to founder')
      onClose()
    } else {
      toast.error('Failed to send request')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request Due Diligence"
      subtitle="Send a document request to the founder for review"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            isLoading={sending}
            disabled={!selectedDeal || !name.trim()}
          >
            Send DD Request
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <ModalSelect
            label="Select Deal"
            value={selectedDeal}
            onChange={setSelectedDeal}
            disabled={loadingDeals}
            required
          >
            <option value="">{loadingDeals ? 'Loading deals...' : 'Select a deal...'}</option>
            {deals.map(d => (
              <option key={d.id} value={d.id}>
                {d.company_name} {d.pipeline_stage ? `(${d.pipeline_stage})` : ''}
              </option>
            ))}
          </ModalSelect>
          {!loadingDeals && deals.length === 0 && (
            <ModalWarning>
              No deals available. You need deals with linked startups to send DD requests.
            </ModalWarning>
          )}
        </div>

        <ModalInput
          label="Checklist Name"
          value={name}
          onChange={setName}
          placeholder="DD Checklist name..."
          required
        />

        <ModalSelect
          label="Template (defines which documents to request)"
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

        <ModalTextarea
          label="Message to Founder (optional)"
          value={message}
          onChange={setMessage}
          placeholder="Add context about what you need..."
          rows={3}
        />
      </div>
    </Modal>
  )
}
