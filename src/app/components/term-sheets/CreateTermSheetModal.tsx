import { useState } from 'react'
import { FileText, Plus } from 'lucide-react'
import { Modal } from '@/app/components/ui/Modal'
import { Button } from '@/app/components/ui/Button'
import { ModalInput, ModalInfo, PillSelector } from '@/app/components/ui/ModalField'
import { ROUND_TYPES } from '@/app/hooks/useTermSheets'

interface Props {
  open: boolean
  onClose: () => void
  onCreate: (name: string, roundType: string) => Promise<void>
}

export function CreateTermSheetModal({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState('New Term Sheet')
  const [roundType, setRoundType] = useState('equity')
  const [creating, setCreating] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setCreating(true)
    await onCreate(name.trim(), roundType)
    setCreating(false)
    setName('New Term Sheet')
    setRoundType('equity')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Term Sheet"
      subtitle="Start with a blank term sheet and customize it"
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={creating}
            disabled={!name.trim()}
          >
            <Plus className="w-3.5 h-3.5" />
            Create
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <ModalInput
          label="Name"
          value={name}
          onChange={setName}
          placeholder="e.g. Series A \u2014 Investor Name"
          autoFocus
          required
        />

        <PillSelector
          label="Round Type"
          options={ROUND_TYPES.map(rt => ({ value: rt.value, label: rt.label }))}
          value={roundType}
          onChange={setRoundType}
        />

        <ModalInfo icon={<FileText className="w-4 h-4" />}>
          You can add all terms, clauses, and investor details after creating. Use AI generation
          for pre-filled terms based on your startup profile.
        </ModalInfo>
      </div>
    </Modal>
  )
}
