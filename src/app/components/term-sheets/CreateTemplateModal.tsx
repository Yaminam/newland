import { useState } from 'react'
import { Modal } from '@/app/components/ui/Modal'
import { Button } from '@/app/components/ui/Button'
import { ModalInput, ModalTextarea, PillSelector } from '@/app/components/ui/ModalField'
import { ROUND_TYPES } from '@/app/hooks/useTermSheets'

interface Props {
  open: boolean
  onClose: () => void
  onCreate: (name: string, roundType: string, terms: Record<string, string>, description?: string) => Promise<any>
  initialTerms?: Record<string, string>
  initialRoundType?: string
}

export function CreateTemplateModal({ open, onClose, onCreate, initialTerms, initialRoundType }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [roundType, setRoundType] = useState(initialRoundType ?? 'equity')
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    const result = await onCreate(name.trim(), roundType, initialTerms ?? {}, description.trim() || undefined)
    setCreating(false)
    if (result) {
      setName('')
      setDescription('')
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Save as Template"
      subtitle="Save the current terms as a reusable template"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={creating}
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            Save Template
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <ModalInput
          label="Template Name"
          value={name}
          onChange={setName}
          placeholder="e.g. My Standard SAFE Terms"
          autoFocus
          required
        />

        <PillSelector
          label="Round Type"
          options={ROUND_TYPES.map(rt => ({ value: rt.value, label: rt.label }))}
          value={roundType}
          onChange={setRoundType}
        />

        <ModalTextarea
          label="Description (optional)"
          value={description}
          onChange={setDescription}
          placeholder="Brief description of when to use this template"
          rows={2}
        />
      </form>
    </Modal>
  )
}
