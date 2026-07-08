import { useState, useEffect } from 'react'
import { Drawer } from '@/app/components/ui/Drawer'
import { Button } from '@/app/components/ui/Button'
import { Badge } from '@/app/components/ui/Badge'
import { Trash2, ExternalLink, X, Clock, Bell, ArrowRight, AlertTriangle, PenLine, DollarSign, Circle } from 'lucide-react'
import { toast } from 'sonner'
import type { PipelineDeal, PipelineStage } from '@/app/hooks/usePipeline'

type WatchlistActivity = {
  id: string
  action: string
  old_value: string | null
  new_value: string | null
  created_at: string
}

interface DealDetailDrawerProps {
  deal: PipelineDeal | null
  stages: PipelineStage[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (dealId: string, updates: Partial<PipelineDeal>) => Promise<boolean>
  onRemove: (dealId: string) => void
  onMoveDeal: (dealId: string, stageId: string, stageName: string) => void
  onSetReminder?: (dealId: string, date: string, note?: string) => void
  onClearReminder?: (dealId: string) => void
  onLoadActivity?: (dealId: string) => Promise<WatchlistActivity[]>
}

export function DealDetailDrawer({
  deal,
  stages,
  open,
  onOpenChange,
  onUpdate,
  onRemove,
  onMoveDeal,
  onSetReminder,
  onClearReminder,
  onLoadActivity,
}: DealDetailDrawerProps) {
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [nextAction, setNextAction] = useState('')
  const [nextActionDate, setNextActionDate] = useState('')
  const [amountUsd, setAmountUsd] = useState('')
  const [saving, setSaving] = useState(false)
  const [reminderDate, setReminderDate] = useState('')
  const [reminderNote, setReminderNote] = useState('')
  const [settingReminder, setSettingReminder] = useState(false)
  const [activity, setActivity] = useState<WatchlistActivity[]>([])
  const [activityLoading, setActivityLoading] = useState(false)

  // Sync form state when deal changes
  useEffect(() => {
    if (!deal) return
    const notesStr = Array.isArray(deal.notes)
      ? deal.notes.map((n: any) => typeof n === 'string' ? n : n.text ?? '').join('\n')
      : typeof deal.notes === 'string'
        ? deal.notes
        : ''
    setNotes(notesStr)
    setTags(deal.tags ?? [])
    setPriority(deal.priority ?? 'medium')
    setNextAction(deal.next_action ?? '')
    setNextActionDate(deal.next_action_date ?? '')
    setAmountUsd(deal.amount_usd ? String(deal.amount_usd) : '')
    setReminderDate(deal.reminder_date ?? '')
    setReminderNote(deal.reminder_note ?? '')
  }, [deal])

  // Load activity when deal changes
  useEffect(() => {
    if (!deal || !onLoadActivity) return
    setActivityLoading(true)
    onLoadActivity(deal.id).then(data => {
      setActivity(data)
      setActivityLoading(false)
    })
  }, [deal, onLoadActivity])

  if (!deal) return null

  const startup = deal.startup
  const currentStage = stages.find(s => s.id === deal.stage_id)

  const handleSave = async () => {
    setSaving(true)
    const notesJson = notes.trim()
      ? notes.split('\n').filter(Boolean).map(text => ({ text, ts: new Date().toISOString() }))
      : []
    const ok = await onUpdate(deal.id, {
      notes: notesJson,
      tags,
      priority,
      next_action: nextAction || null,
      next_action_date: nextActionDate || null,
      amount_usd: amountUsd ? Number(amountUsd) : null,
    } as any)
    setSaving(false)
    if (ok) {
      toast.success('Deal updated')
      onOpenChange(false)
    } else {
      toast.error('Failed to update')
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
    setTagInput('')
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleRemoveDeal = () => {
    onRemove(deal.id)
    onOpenChange(false)
    toast.success('Removed from pipeline')
  }

  const handleSetReminder = async () => {
    if (!reminderDate) {
      toast.error('Please select a reminder date')
      return
    }
    if (!onSetReminder) return
    setSettingReminder(true)
    onSetReminder(deal.id, reminderDate, reminderNote || undefined)
    setSettingReminder(false)
    toast.success('Reminder set')
  }

  const handleClearReminder = () => {
    if (!onClearReminder) return
    onClearReminder(deal.id)
    setReminderDate('')
    setReminderNote('')
    toast.success('Reminder cleared')
  }

  function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  function ActionIcon({ action }: { action: string }) {
    const cls = "w-3 h-3"
    if (action.includes('stage')) return <ArrowRight className={cls} />
    if (action.includes('priority')) return <AlertTriangle className={cls} />
    if (action.includes('note')) return <PenLine className={cls} />
    if (action.includes('amount')) return <DollarSign className={cls} />
    return <Circle className={cls} />
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={startup?.company_name ?? 'Deal Details'}
      subtitle={startup?.sector ? `${startup.sector} · ${startup.stage ?? ''}` : undefined}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="danger" size="sm" iconLeft={Trash2} onClick={handleRemoveDeal}>
            Remove
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} isLoading={saving}>
              Save
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Startup info header */}
        <div
          className="flex items-center gap-3 p-3.5 rounded-[var(--r-md)]"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
        >
          <div
            className="w-10 h-10 rounded-[var(--r-sm)] flex items-center justify-center text-[15px] font-bold shrink-0"
            style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
          >
            {(startup?.company_name ?? '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--ink)' }}>
              {startup?.company_name}
            </p>
            <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
              {[startup?.sector, startup?.country].filter(Boolean).join(' · ')}
            </p>
          </div>
          <a
            href={`/dashboard/marketplace`}
            className="shrink-0 p-2 rounded-[var(--r-sm)] hover:bg-[var(--surface-3)] transition-colors"
            style={{ color: 'var(--muted)' }}
            title="View full profile"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Stage selector */}
        <div>
          <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
            Stage
          </label>
          <div className="flex flex-wrap gap-1.5">
            {stages.map(s => (
              <button
                key={s.id}
                onClick={() => onMoveDeal(deal.id, s.id, s.name)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer"
                style={{
                  background: s.id === deal.stage_id ? s.color + '20' : 'var(--surface-2)',
                  color: s.id === deal.stage_id ? s.color : 'var(--muted)',
                  border: `1px solid ${s.id === deal.stage_id ? s.color + '40' : 'var(--line)'}`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
            Priority
          </label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium capitalize transition-colors cursor-pointer"
                style={{
                  background: priority === p ? 'var(--blue-bg)' : 'var(--surface-2)',
                  color: priority === p ? 'var(--blue)' : 'var(--muted)',
                  border: `1px solid ${priority === p ? 'var(--blue)' : 'var(--line)'}`,
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
            Tags
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map(tag => (
              <Badge key={tag} variant="info" className="text-[11px] gap-1">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-0.5 hover:opacity-70 cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              placeholder="Add tag…"
              className="flex-1 px-3 py-1.5 text-[13px] rounded-[var(--r-sm)] outline-0"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
              }}
            />
            <Button variant="secondary" size="sm" onClick={handleAddTag}>
              Add
            </Button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
            Deal Amount (USD)
          </label>
          <input
            type="number"
            value={amountUsd}
            onChange={e => setAmountUsd(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 text-[13px] rounded-[var(--r-sm)] outline-0"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              color: 'var(--ink)',
            }}
          />
        </div>

        {/* Next action */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
              Next Action
            </label>
            <input
              value={nextAction}
              onChange={e => setNextAction(e.target.value)}
              placeholder="e.g. Follow up call"
              className="w-full px-3 py-2 text-[13px] rounded-[var(--r-sm)] outline-0"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
              }}
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
              Due Date
            </label>
            <input
              type="date"
              value={nextActionDate}
              onChange={e => setNextActionDate(e.target.value)}
              className="w-full px-3 py-2 text-[13px] rounded-[var(--r-sm)] outline-0"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
              }}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
            Notes
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add notes about this deal…"
            rows={5}
            className="w-full px-3 py-2.5 text-[13px] rounded-[var(--r-md)] outline-0 resize-y"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              color: 'var(--ink)',
              lineHeight: '1.6',
            }}
          />
        </div>

        {/* Reminder */}
        {onSetReminder && (
          <div
            className="p-3.5 rounded-[var(--r-md)]"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <Bell className="w-3.5 h-3.5" style={{ color: 'var(--blue)' }} />
              <label className="text-[12px] font-semibold" style={{ color: 'var(--muted)' }}>
                Reminder
              </label>
              {deal.reminder_date && (
                <span
                  className="ml-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
                >
                  Set: {deal.reminder_date}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="date"
                value={reminderDate}
                onChange={e => setReminderDate(e.target.value)}
                className="px-3 py-2 text-[13px] rounded-[var(--r-sm)] outline-0"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                }}
              />
              <input
                type="text"
                value={reminderNote}
                onChange={e => setReminderNote(e.target.value)}
                placeholder="Note (optional)"
                className="px-3 py-2 text-[13px] rounded-[var(--r-sm)] outline-0"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" iconLeft={Bell} onClick={handleSetReminder} isLoading={settingReminder}>
                Set Reminder
              </Button>
              {deal.reminder_date && onClearReminder && (
                <Button variant="ghost" size="sm" onClick={handleClearReminder}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        {onLoadActivity && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Clock className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
              <label className="text-[12px] font-semibold" style={{ color: 'var(--muted)' }}>
                Activity
              </label>
            </div>
            {activityLoading ? (
              <p className="text-[12px] py-2" style={{ color: 'var(--muted-2)' }}>Loading…</p>
            ) : activity.length === 0 ? (
              <p className="text-[12px] py-2" style={{ color: 'var(--muted-2)' }}>No activity yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {activity.map(entry => (
                  <div key={entry.id} className="flex gap-2.5 items-start">
                    <div
                      className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                      style={{ background: 'var(--surface-2)', color: 'var(--muted)', border: '1px solid var(--line)' }}
                    >
                      <ActionIcon action={entry.action} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium" style={{ color: 'var(--ink)' }}>
                        {entry.action}
                      </p>
                      {(entry.old_value || entry.new_value) && (
                        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                          {entry.old_value ? <span style={{ color: 'var(--neg)' }}>{entry.old_value}</span> : null}
                          {entry.old_value && entry.new_value ? <span className="mx-1">→</span> : null}
                          {entry.new_value ? <span style={{ color: 'var(--pos)' }}>{entry.new_value}</span> : null}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] shrink-0 mt-0.5" style={{ color: 'var(--muted-2)' }}>
                      {relativeTime(entry.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  )
}
