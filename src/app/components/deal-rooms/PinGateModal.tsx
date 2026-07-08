import { useState, useRef, useEffect } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import { Modal } from '@/app/components/ui/Modal'

interface Props {
  open: boolean
  onClose: () => void
  onVerify: (pin: string) => Promise<boolean>
  roomName: string
}

export function PinGateModal({ open, onClose, onVerify, roomName }: Props) {
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (open) {
      setDigits(['', '', '', ''])
      setError(false)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }, [open])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const digit = value.slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    setError(false)

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 4 digits are filled
    if (digit && index === 3 && next.every(d => d !== '')) {
      handleSubmit(next.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (pasted.length === 4) {
      const next = pasted.split('')
      setDigits(next)
      setError(false)
      inputRefs.current[3]?.focus()
      handleSubmit(pasted)
    }
  }

  const handleSubmit = async (pin: string) => {
    if (pin.length !== 4 || verifying) return
    setVerifying(true)
    const ok = await onVerify(pin)
    setVerifying(false)
    if (!ok) {
      setError(true)
      setDigits(['', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="sm" hideClose>
      <div className="flex flex-col items-center gap-5 py-2">
        {/* Lock icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--blue-bg)' }}
        >
          <Lock className="w-7 h-7" style={{ color: 'var(--blue)' }} />
        </div>

        {/* Title */}
        <div className="text-center">
          <h3
            className="text-[17px] font-bold"
            style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}
          >
            Enter Room PIN
          </h3>
          <p className="text-[13px] mt-1" style={{ color: 'var(--muted)' }}>
            {roomName} is protected with a 4-digit PIN
          </p>
        </div>

        {/* PIN inputs */}
        <div className="flex items-center gap-3" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={verifying}
              className="w-12 h-14 text-center text-[22px] font-bold rounded-xl border-2 focus:outline-none transition-all"
              style={{
                background: 'var(--bg)',
                color: 'var(--ink)',
                borderColor: error
                  ? 'var(--neg)'
                  : d
                    ? 'var(--blue)'
                    : 'var(--line)',
                boxShadow: d && !error ? '0 0 0 3px var(--blue-bg)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-[12px] font-semibold -mt-2" style={{ color: 'var(--neg)' }}>
            Incorrect PIN. Please try again.
          </p>
        )}

        {/* Verifying indicator */}
        {verifying && (
          <div className="flex items-center gap-2 -mt-2">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--blue)' }} />
            <span className="text-[12px] font-medium" style={{ color: 'var(--muted)' }}>
              Verifying...
            </span>
          </div>
        )}

        {/* Cancel */}
        <button
          onClick={onClose}
          className="text-[12px] font-medium cursor-pointer transition-opacity hover:opacity-70"
          style={{ color: 'var(--muted-2)' }}
        >
          Cancel
        </button>
      </div>
    </Modal>
  )
}
