import { useState, useEffect } from 'react'
import { Lock, Trash2 } from 'lucide-react'
import { Modal } from '@/app/components/ui/Modal'
import { Button } from '@/app/components/ui/Button'
import { ModalInput, ModalTextarea } from '@/app/components/ui/ModalField'
import type { DealRoom } from '@/app/hooks/useDealRooms'

interface Props {
  open: boolean
  onClose: () => void
  room: DealRoom
  onUpdate: (roomId: string, updates: { name?: string; description?: string | null }) => Promise<boolean>
  onSetPin: (roomId: string, pin: string | null) => Promise<boolean>
  onDelete: (roomId: string) => Promise<boolean>
}

export function EditRoomModal({ open, onClose, room, onUpdate, onSetPin, onDelete }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // PIN
  const [pinSection, setPinSection] = useState<'view' | 'set' | 'remove'>('view')
  const [newPin, setNewPin] = useState('')
  const [pinSaving, setPinSaving] = useState(false)

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(room.name)
      setDescription(room.description ?? '')
      setPinSection('view')
      setNewPin('')
      setShowDeleteConfirm(false)
    }
  }, [open, room])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    const ok = await onUpdate(room.id, {
      name: name.trim(),
      description: description.trim() || null,
    })
    setSaving(false)
    if (ok) onClose()
  }

  const handleSetPin = async () => {
    if (!/^\d{4}$/.test(newPin)) return
    setPinSaving(true)
    const ok = await onSetPin(room.id, newPin)
    setPinSaving(false)
    if (ok) {
      setPinSection('view')
      setNewPin('')
    }
  }

  const handleRemovePin = async () => {
    setPinSaving(true)
    const ok = await onSetPin(room.id, null)
    setPinSaving(false)
    if (ok) setPinSection('view')
  }

  const handleDelete = async () => {
    setDeleting(true)
    const ok = await onDelete(room.id)
    setDeleting(false)
    if (ok) onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Room Settings"
      subtitle={room.name}
      footer={
        <div className="flex items-center gap-2 w-full">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={saving}
            onClick={handleSave}
            disabled={!name.trim()}
            className="ml-auto"
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <ModalInput
          label="Room Name"
          value={name}
          onChange={setName}
          required
        />

        <ModalTextarea
          label="Description"
          value={description}
          onChange={setDescription}
          rows={3}
        />

        {/* PIN Management */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1.5px solid var(--line)' }}
        >
          <div
            className="flex items-center gap-3 px-3 py-3"
            style={{ background: 'var(--surface)' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: room.has_pin ? 'var(--blue-bg)' : 'var(--surface-2)' }}
            >
              <Lock className="w-4 h-4" style={{ color: room.has_pin ? 'var(--blue)' : 'var(--muted-2)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>
                Room PIN
              </p>
              <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>
                {room.has_pin ? 'PIN is set — investors need it to access' : 'No PIN set'}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {room.has_pin ? (
                <>
                  <button
                    onClick={() => setPinSection(pinSection === 'set' ? 'view' : 'set')}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md cursor-pointer transition-colors hover:bg-[var(--bg-soft)]"
                    style={{ color: 'var(--blue)' }}
                  >
                    Change
                  </button>
                  <button
                    onClick={() => setPinSection(pinSection === 'remove' ? 'view' : 'remove')}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-md cursor-pointer transition-colors hover:bg-[var(--bg-soft)]"
                    style={{ color: 'var(--neg)' }}
                  >
                    Remove
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setPinSection(pinSection === 'set' ? 'view' : 'set')}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-md cursor-pointer transition-colors hover:bg-[var(--bg-soft)]"
                  style={{ color: 'var(--blue)' }}
                >
                  Set PIN
                </button>
              )}
            </div>
          </div>

          {/* Set/Change PIN */}
          {pinSection === 'set' && (
            <div className="px-3 py-3 flex items-center gap-3" style={{ borderTop: '1px solid var(--line)', background: 'var(--bg-soft)' }}>
              <div className="flex items-center gap-2">
                {[0, 1, 2, 3].map(i => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={newPin[i] ?? ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(-1)
                      const next = newPin.split('')
                      next[i] = val
                      setNewPin(next.join('').slice(0, 4))
                      if (val) {
                        const nextEl = e.target.parentElement?.parentElement?.querySelectorAll('input')[i + 1] as HTMLInputElement | undefined
                        nextEl?.focus()
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && !newPin[i] && i > 0) {
                        const prev = (e.target as HTMLElement).parentElement?.parentElement?.querySelectorAll('input')[i - 1] as HTMLInputElement | undefined
                        prev?.focus()
                      }
                    }}
                    className="w-10 h-11 text-center text-[16px] font-bold rounded-lg border-2 focus:outline-none transition-colors"
                    style={{
                      background: 'var(--surface)',
                      color: 'var(--ink)',
                      borderColor: newPin[i] ? 'var(--blue)' : 'var(--line)',
                    }}
                  />
                ))}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSetPin}
                disabled={!/^\d{4}$/.test(newPin)}
                isLoading={pinSaving}
              >
                {room.has_pin ? 'Update' : 'Set'}
              </Button>
            </div>
          )}

          {/* Remove PIN confirm */}
          {pinSection === 'remove' && (
            <div
              className="px-3 py-3 flex items-center justify-between"
              style={{ borderTop: '1px solid var(--line)', background: 'var(--neg-bg, #FEF2F2)' }}
            >
              <p className="text-[12px] font-medium" style={{ color: 'var(--neg)' }}>
                Remove PIN protection?
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPinSection('view')}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-md cursor-pointer"
                  style={{ color: 'var(--muted)' }}
                >
                  Cancel
                </button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRemovePin}
                  isLoading={pinSaving}
                >
                  Remove
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1.5px solid var(--neg-line, #FCA5A5)' }}
        >
          <div
            className="flex items-center gap-3 px-3 py-3"
            style={{ background: 'var(--surface)' }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--neg-bg, #FEF2F2)' }}
            >
              <Trash2 className="w-4 h-4" style={{ color: 'var(--neg)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold" style={{ color: 'var(--neg)' }}>
                Delete Room
              </p>
              <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>
                Permanently delete this room, all documents, chats, and activity
              </p>
            </div>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-md cursor-pointer transition-colors hover:bg-[var(--neg-bg)]"
                style={{ color: 'var(--neg)' }}
              >
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-md cursor-pointer"
                  style={{ color: 'var(--muted)' }}
                >
                  Cancel
                </button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDelete}
                  isLoading={deleting}
                >
                  Confirm Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
