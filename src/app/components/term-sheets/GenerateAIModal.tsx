import { useState, useEffect } from 'react'
import { Sparkles, Scale, Shield, Heart } from 'lucide-react'
import { Modal } from '@/app/components/ui/Modal'
import { Button } from '@/app/components/ui/Button'
import { ModalInput, ModalInfo, PillSelector } from '@/app/components/ui/ModalField'
import { ROUND_TYPES } from '@/app/hooks/useTermSheets'
import { supabase } from '@/app/lib/supabase'
import { useAuth } from '@/app/context/AuthContext'

interface Props {
  open: boolean
  onClose: () => void
  onGenerate: (startupId: string, roundType: string, investorId?: string, generationMode?: string, customParams?: Record<string, string>) => Promise<Record<string, string> | null>
  onTermsGenerated: (terms: Record<string, string>, roundType: string) => void
}

const MODES = [
  { value: 'balanced', label: 'Balanced', description: 'Fair to both parties', icon: <Scale className="w-4 h-4" style={{ color: 'var(--blue)' }} />, color: 'var(--blue)' },
  { value: 'founder_friendly', label: 'Founder Friendly', description: 'Minimizes investor control', icon: <Heart className="w-4 h-4" style={{ color: 'var(--pos)' }} />, color: 'var(--pos)' },
  { value: 'investor_friendly', label: 'Investor Friendly', description: 'Stronger protections', icon: <Shield className="w-4 h-4" style={{ color: 'var(--warn)' }} />, color: 'var(--warn)' },
]

export function GenerateAIModal({ open, onClose, onGenerate, onTermsGenerated }: Props) {
  const { user } = useAuth()
  const [roundType, setRoundType] = useState('equity')
  const [generationMode, setGenerationMode] = useState('balanced')
  const [startupId, setStartupId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [preMoneyValuation, setPreMoneyValuation] = useState('')
  const [investmentAmount, setInvestmentAmount] = useState('')
  const [instrumentType, setInstrumentType] = useState('')
  const [boardSeats, setBoardSeats] = useState('')

  useEffect(() => {
    if (!user || !open) return
    supabase
      .from('startup_applications')
      .select('id')
      .eq('founder_id', user.id)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setStartupId(data.id)
      })
  }, [user, open])

  const handleGenerate = async () => {
    if (!startupId) return
    setGenerating(true)
    const customParams: Record<string, string> = {}
    if (preMoneyValuation.trim()) customParams.pre_money_valuation = preMoneyValuation.trim()
    if (investmentAmount.trim()) customParams.investment_amount = investmentAmount.trim()
    if (instrumentType) customParams.instrument_type = instrumentType
    if (boardSeats.trim()) customParams.board_seats = boardSeats.trim()
    const terms = await onGenerate(startupId, roundType, undefined, generationMode, customParams)
    setGenerating(false)
    if (terms) {
      onTermsGenerated(terms, roundType)
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate with AI"
      subtitle="AI will draft terms based on your startup profile"
      size="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerate}
            isLoading={generating}
            disabled={!startupId}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <PillSelector
          label="Round Type"
          options={ROUND_TYPES.map(rt => ({ value: rt.value, label: rt.label }))}
          value={roundType}
          onChange={setRoundType}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModalInput
            label="Pre-money Valuation"
            value={preMoneyValuation}
            onChange={setPreMoneyValuation}
            placeholder="e.g. \u20B910 Cr"
          />
          <ModalInput
            label="Investment Amount"
            value={investmentAmount}
            onChange={setInvestmentAmount}
            placeholder="e.g. \u20B92 Cr"
          />
        </div>

        <PillSelector
          label="Instrument Type"
          options={[
            { value: 'CCPS', label: 'CCPS' },
            { value: 'Equity', label: 'Equity' },
            { value: 'SAFE', label: 'SAFE' },
            { value: 'CCD', label: 'CCD' },
          ]}
          value={instrumentType}
          onChange={v => setInstrumentType(prev => prev === v ? '' : v)}
        />

        <ModalInput
          label="Board Seats"
          value={boardSeats}
          onChange={setBoardSeats}
          placeholder="e.g. 1 investor seat"
        />

        <PillSelector
          label="Generation Mode"
          options={MODES}
          value={generationMode}
          onChange={setGenerationMode}
          variant="card"
          columns={3}
        />

        {!startupId && (
          <p className="text-[12px]" style={{ color: 'var(--neg)' }}>
            No startup application found. Submit your listing first.
          </p>
        )}

        <ModalInfo icon={<Sparkles className="w-4 h-4" />}>
          AI will analyze your startup profile and generate market-standard terms. You can edit all values after generation.
        </ModalInfo>
      </div>
    </Modal>
  )
}
