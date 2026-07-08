import { useState } from 'react'
import { Lock } from 'lucide-react'
import { Modal } from '@/app/components/ui/Modal'
import { Button } from '@/app/components/ui/Button'
import { ModalInput, ModalTextarea } from '@/app/components/ui/ModalField'

interface Props {
  open: boolean
  onClose: () => void
  onCreate: (name: string, description?: string, pin?: string) => Promise<any>
}

export function CreateRoomModal({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [pinEnabled, setPinEnabled] = useState(false)
  const [pin, setPin] = useState('')
  const [creating, setCreating] = useState(false)

  const pinValid = !pinEnabled || /^\d{4}$/.test(pin)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !pinValid) return
    setCreating(true)
    const result = await onCreate(
      name.trim(),
      description.trim() || undefined,
      pinEnabled && pin.trim() ? pin.trim() : undefined,
    )
    setCreating(false)
    if (result) {
      setName('')
      setDescription('')
      setPin('')
      setPinEnabled(false)
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Deal Room"
      subtitle="Create a secure space to share documents with investors"
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
            disabled={!name.trim() || !pinValid}
          >
            Create Room
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <ModalInput
          label="Room Name"
          value={name}
          onChange={setName}
          placeholder="e.g. Series A Data Room"
          autoFocus
          required
        />

        <ModalTextarea
          label="Description (optional)"
          value={description}
          onChange={setDescription}
          placeholder="What documents will be shared here?"
          rows={3}
        />

        {/* PIN toggle */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1.5px solid var(--line)' }}
        >
          <button
            type="button"
            onClick={() => { setPinEnabled(!pinEnabled); if (pinEnabled) setPin('') }}
            className="flex items-center gap-3 w-full px-4 py-3 text-left cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
            style={{ background: 'var(--surface)' }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: pinEnabled ? 'color-mix(in srgb, var(--blue) 12%, transparent)' : 'var(--surface-2)' }}
            >
              <Lock className="w-4 h-4" style={{ color: pinEnabled ? 'var(--blue)' : 'var(--muted-2)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>
                Set a 4-digit PIN
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-2)' }}>
                Investors will need this PIN to access the room
              </p>
            </div>
            <div
              className="w-10 h-[22px] rounded-full flex items-center shrink-0 transition-all"
              style={{
                background: pinEnabled ? 'var(--blue)' : 'var(--surface-3)',
                padding: '2px',
              }}
            >
              <div
                className="w-[18px] h-[18px] rounded-full bg-white transition-transform shadow-sm"
                style={{ transform: pinEnabled ? 'translateX(18px)' : 'translateX(0)' }}
              />
            </div>
          </button>

          {/* PIN input */}
          {pinEnabled && (
            <div className="px-4 py-4" style={{ borderTop: '1.5px solid var(--line)', background: 'var(--surface-2)' }}>
              <div className="flex items-center gap-3 justify-center">
                {[0, 1, 2, 3].map(i => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={pin[i] ?? ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '')
                      if (!val && pin.length > i) {
                        setPin(pin.slice(0, i) + pin.slice(i + 1))
                        return
                      }
                      const digit = val.slice(-1)
                      const next = pin.split('')
                      next[i] = digit
                      const newPin = next.join('').slice(0, 4)
                      setPin(newPin)
                      if (digit) {
                        const nextInput = e.target.parentElement?.parentElement?.querySelectorAll('input')[i + 1] as HTMLInputElement | undefined
                        nextInput?.focus()
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && !pin[i] && i > 0) {
                        const prevInput = (e.target as HTMLElement).parentElement?.parentElement?.querySelectorAll('input')[i - 1] as HTMLInputElement | undefined
                        prevInput?.focus()
                      }
                    }}
                    className="w-12 h-14 text-center text-[20px] font-bold rounded-xl outline-none transition-all duration-200"
                    style={{
                      background: 'var(--surface)',
                      color: 'var(--ink)',
                      border: `2px solid ${pin[i] ? 'var(--blue)' : 'var(--line)'}`,
                      boxShadow: pin[i] ? '0 0 0 3px color-mix(in srgb, var(--blue) 12%, transparent)' : 'none',
                    }}
                  />
                ))}
              </div>
              <p className="text-[11px] mt-3 text-center" style={{ color: 'var(--muted-2)' }}>
                Share this PIN with investors separately after inviting them
              </p>
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
