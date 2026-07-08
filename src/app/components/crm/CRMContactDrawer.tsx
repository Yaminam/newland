import { useState, useEffect } from 'react'
import { Drawer } from '@/app/components/ui/Drawer'
import { Button } from '@/app/components/ui/Button'
import { Badge } from '@/app/components/ui/Badge'
import { CRMInteractionTimeline } from './CRMInteractionTimeline'
import {
  Trash2, ExternalLink, X, Plus, Bell, Mail, Phone,
  Linkedin, Clock, Sparkles, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  CRM_STAGES,
  type CRMContact,
  type CRMInteraction,
  type CRMReminder,
  type CRMStageKey,
} from '@/app/hooks/useCRM'

interface CRMContactDrawerProps {
  contact: CRMContact | null
  interactions: CRMInteraction[]
  reminders: CRMReminder[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (contactId: string, updates: Partial<CRMContact>) => Promise<boolean>
  onMoveStage: (contactId: string, stage: CRMStageKey) => void
  onDelete: (contactId: string) => void
  onAddInteraction: (interaction: {
    contact_id: string; type: string; title: string; body?: string; next_action?: string; next_action_date?: string
  }) => Promise<any>
  onAddReminder: (reminder: {
    contact_id: string; title: string; remind_at: string
  }) => Promise<any>
  onCompleteReminder: (reminderId: string) => Promise<boolean>
  onLoadInteractions: (contactId: string) => void
  onLoadReminders: (contactId: string) => void
  onGetAISummary?: (contactId: string, onChunk: (text: string) => void) => Promise<boolean>
}

const INTERACTION_TYPES = [
  { value: 'meeting',   label: 'Meeting' },
  { value: 'call',      label: 'Call' },
  { value: 'email',     label: 'Email' },
  { value: 'note',      label: 'Note' },
  { value: 'follow_up', label: 'Follow-up' },
]

export function CRMContactDrawer({
  contact,
  interactions,
  reminders,
  open,
  onOpenChange,
  onUpdate,
  onMoveStage,
  onDelete,
  onAddInteraction,
  onAddReminder,
  onCompleteReminder,
  onLoadInteractions,
  onLoadReminders,
  onGetAISummary,
}: CRMContactDrawerProps) {
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [saving, setSaving] = useState(false)

  // Interaction form
  const [showAddInteraction, setShowAddInteraction] = useState(false)
  const [intType, setIntType] = useState('note')
  const [intTitle, setIntTitle] = useState('')
  const [intBody, setIntBody] = useState('')
  const [intNextAction, setIntNextAction] = useState('')
  const [intNextActionDate, setIntNextActionDate] = useState('')

  // Reminder form
  const [showAddReminder, setShowAddReminder] = useState(false)
  const [reminderTitle, setReminderTitle] = useState('')
  const [reminderDate, setReminderDate] = useState('')

  // AI summary
  const [aiSummary, setAiSummary] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'reminders' | 'ai'>('details')

  // Sync form state when contact changes
  useEffect(() => {
    if (!contact) return
    setNotes(contact.notes ?? '')
    setTags(contact.tags ?? [])
    setEmail(contact.email ?? '')
    setPhone(contact.phone ?? '')
    setLinkedinUrl(contact.linkedin_url ?? '')
    setActiveTab('details')
    setShowAddInteraction(false)
    setShowAddReminder(false)
    setAiSummary('')
    setAiLoading(false)
    onLoadInteractions(contact.id)
    onLoadReminders(contact.id)
  }, [contact?.id])

  if (!contact) return null

  const handleSave = async () => {
    setSaving(true)
    const ok = await onUpdate(contact.id, {
      notes: notes || null,
      tags,
      email: email || null,
      phone: phone || null,
      linkedin_url: linkedinUrl || null,
    })
    setSaving(false)
    if (ok) {
      toast.success('Contact updated')
      onOpenChange(false)
    } else {
      toast.error('Failed to update')
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag)) setTags([...tags, tag])
    setTagInput('')
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleDeleteContact = () => {
    onDelete(contact.id)
    onOpenChange(false)
    toast.success('Contact removed')
  }

  const handleSubmitInteraction = async () => {
    if (!intTitle.trim()) return
    await onAddInteraction({
      contact_id: contact.id,
      type: intType,
      title: intTitle.trim(),
      body: intBody.trim() || undefined,
      next_action: intNextAction.trim() || undefined,
      next_action_date: intNextActionDate || undefined,
    })
    toast.success('Interaction logged')
    setIntTitle('')
    setIntBody('')
    setIntNextAction('')
    setIntNextActionDate('')
    setShowAddInteraction(false)
    onLoadInteractions(contact.id)
  }

  const handleSubmitReminder = async () => {
    if (!reminderTitle.trim() || !reminderDate) return
    await onAddReminder({
      contact_id: contact.id,
      title: reminderTitle.trim(),
      remind_at: new Date(reminderDate).toISOString(),
    })
    toast.success('Reminder set')
    setReminderTitle('')
    setReminderDate('')
    setShowAddReminder(false)
    onLoadReminders(contact.id)
  }

  const handleRequestAI = async () => {
    if (!onGetAISummary || aiLoading) return
    setAiSummary('')
    setAiLoading(true)
    await onGetAISummary(contact.id, (chunk) => {
      setAiSummary(prev => prev + chunk)
    })
    setAiLoading(false)
  }

  const tabs = [
    { key: 'details' as const, label: 'Details' },
    { key: 'timeline' as const, label: `Timeline (${interactions.length})` },
    { key: 'reminders' as const, label: `Reminders (${reminders.length})` },
    ...(onGetAISummary ? [{ key: 'ai' as const, label: 'AI Insights' }] : []),
  ]

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={contact.display_name}
      subtitle={contact.firm_name ? `${contact.firm_name}` : undefined}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="danger" size="sm" iconLeft={Trash2} onClick={handleDeleteContact}>
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
        {/* Contact header card */}
        <div
          className="flex items-center gap-3 p-3.5 rounded-[var(--r-md)]"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
        >
          {contact.avatar_url ? (
            <img
              src={contact.avatar_url}
              alt={contact.display_name}
              className="w-10 h-10 rounded-full shrink-0 object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold shrink-0"
              style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
            >
              {(contact.display_name ?? '?')[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--ink)' }}>
              {contact.display_name}
            </p>
            <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
              {[contact.firm_name, contact.source !== 'manual' ? `via ${contact.source.replace('_', ' ')}` : null]
                .filter(Boolean).join(' \u00b7 ')}
            </p>
          </div>
        </div>

        {/* Stage selector */}
        <div>
          <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
            Stage
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CRM_STAGES.map(s => (
              <button
                key={s.key}
                onClick={() => onMoveStage(contact.id, s.key)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer"
                style={{
                  background: s.key === contact.stage ? s.color + '20' : 'var(--surface-2)',
                  color: s.key === contact.stage ? s.color : 'var(--muted)',
                  border: `1px solid ${s.key === contact.stage ? s.color + '40' : 'var(--line)'}`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-[var(--r-md)]" style={{ background: 'var(--surface-2)' }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 px-3 py-1.5 text-[12px] font-medium rounded-[var(--r-sm)] transition-colors cursor-pointer"
              style={{
                background: activeTab === tab.key ? 'var(--surface)' : 'transparent',
                color: activeTab === tab.key ? 'var(--ink)' : 'var(--muted)',
                boxShadow: activeTab === tab.key ? 'var(--sh-1)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            {/* Hint */}
            <p className="text-[11px] leading-relaxed px-3 py-2 rounded-lg" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
              Save investor contact details shared during meetings or intros for quick reference.
            </p>
            {/* Contact info */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--muted-2)' }} />
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="investor@example.com"
                    className="w-full pl-9 pr-3 py-2 text-[13px] rounded-[var(--r-sm)] outline-0"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink)',
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--muted-2)' }} />
                    <input
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91..."
                      className="w-full pl-9 pr-3 py-2 text-[13px] rounded-[var(--r-sm)] outline-0"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--line)',
                        color: 'var(--ink)',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                    LinkedIn
                  </label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--muted-2)' }} />
                    <input
                      value={linkedinUrl}
                      onChange={e => setLinkedinUrl(e.target.value)}
                      placeholder="linkedin.com/in/..."
                      className="w-full pl-9 pr-3 py-2 text-[13px] rounded-[var(--r-sm)] outline-0"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--line)',
                        color: 'var(--ink)',
                      }}
                    />
                  </div>
                </div>
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
                    <button onClick={() => handleRemoveTag(tag)} className="ml-0.5 hover:opacity-70 cursor-pointer">
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
                  placeholder="Add tag\u2026"
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

            {/* Notes */}
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                Notes
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes about this investor\u2026"
                rows={4}
                className="w-full px-3 py-2.5 text-[13px] rounded-[var(--r-md)] outline-0 resize-y"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                  lineHeight: '1.6',
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div>
            {/* Add interaction */}
            <div className="mb-4">
              {!showAddInteraction ? (
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={Plus}
                  onClick={() => setShowAddInteraction(true)}
                >
                  Log interaction
                </Button>
              ) : (
                <div
                  className="p-3 rounded-[var(--r-md)] space-y-2.5"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
                >
                  <div className="flex flex-wrap gap-1.5">
                    {INTERACTION_TYPES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setIntType(t.value)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors cursor-pointer"
                        style={{
                          background: intType === t.value ? 'var(--blue-bg)' : 'var(--surface)',
                          color: intType === t.value ? 'var(--blue)' : 'var(--muted)',
                          border: `1px solid ${intType === t.value ? 'var(--blue)' : 'var(--line)'}`,
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <input
                    value={intTitle}
                    onChange={e => setIntTitle(e.target.value)}
                    placeholder="Title (e.g. Intro call with partner)"
                    className="w-full px-3 py-2 text-[13px] rounded-[var(--r-sm)] outline-0"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink)',
                    }}
                  />
                  <textarea
                    value={intBody}
                    onChange={e => setIntBody(e.target.value)}
                    placeholder="Notes (optional)"
                    rows={2}
                    className="w-full px-3 py-2 text-[13px] rounded-[var(--r-sm)] outline-0 resize-y"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink)',
                    }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                        Next Action
                      </label>
                      <input
                        value={intNextAction}
                        onChange={e => setIntNextAction(e.target.value)}
                        placeholder="e.g. Send deck"
                        className="w-full px-3 py-2 text-[13px] rounded-[var(--r-sm)] outline-0"
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--line)',
                          color: 'var(--ink)',
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--muted)' }}>
                        Next Action Date
                      </label>
                      <input
                        type="date"
                        value={intNextActionDate}
                        onChange={e => setIntNextActionDate(e.target.value)}
                        className="w-full px-3 py-2 text-[13px] rounded-[var(--r-sm)] outline-0"
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--line)',
                          color: 'var(--ink)',
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="secondary" size="sm" onClick={() => setShowAddInteraction(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSubmitInteraction}>
                      Log
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <CRMInteractionTimeline interactions={interactions} />
          </div>
        )}

        {activeTab === 'reminders' && (
          <div>
            {/* Add reminder */}
            <div className="mb-4">
              {!showAddReminder ? (
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={Bell}
                  onClick={() => setShowAddReminder(true)}
                >
                  Set reminder
                </Button>
              ) : (
                <div
                  className="p-3 rounded-[var(--r-md)] space-y-2.5"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
                >
                  <input
                    value={reminderTitle}
                    onChange={e => setReminderTitle(e.target.value)}
                    placeholder="Reminder title (e.g. Follow up on term sheet)"
                    className="w-full px-3 py-2 text-[13px] rounded-[var(--r-sm)] outline-0"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink)',
                    }}
                  />
                  <input
                    type="datetime-local"
                    value={reminderDate}
                    onChange={e => setReminderDate(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] rounded-[var(--r-sm)] outline-0"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink)',
                    }}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="secondary" size="sm" onClick={() => setShowAddReminder(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSubmitReminder}>
                      Set
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Reminders list */}
            {reminders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[13px]" style={{ color: 'var(--muted-2)' }}>
                  No pending reminders
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {reminders.map(r => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 p-3 rounded-[var(--r-sm)]"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
                  >
                    <Bell className="w-4 h-4 shrink-0" style={{ color: 'var(--warn)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: 'var(--ink)' }}>
                        {r.title}
                      </p>
                      <p className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--muted)' }}>
                        <Clock className="w-3 h-3" />
                        {new Date(r.remind_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onCompleteReminder(r.id)}
                    >
                      Done
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4">
            {!aiSummary && !aiLoading && (
              <div className="text-center py-6">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'var(--blue-bg)' }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: 'var(--blue)' }} />
                </div>
                <p className="text-[13px] font-medium mb-1" style={{ color: 'var(--ink)' }}>
                  AI Relationship Insights
                </p>
                <p className="text-[12px] mb-4" style={{ color: 'var(--muted)' }}>
                  Get an AI-powered summary of your relationship, engagement patterns, and suggested next steps.
                </p>
                <Button variant="primary" size="sm" iconLeft={Sparkles} onClick={handleRequestAI}>
                  Generate Insights
                </Button>
              </div>
            )}
            {aiLoading && !aiSummary && (
              <div className="flex items-center justify-center py-8 gap-2">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--blue)' }} />
                <span className="text-[13px]" style={{ color: 'var(--muted)' }}>Analyzing relationship...</span>
              </div>
            )}
            {aiSummary && (
              <div>
                <div
                  className="p-4 rounded-[var(--r-md)] text-[13px] leading-relaxed whitespace-pre-wrap"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
                >
                  {aiSummary}
                  {aiLoading && <span className="inline-block w-1.5 h-4 ml-0.5 bg-[var(--blue)] animate-pulse rounded-sm" />}
                </div>
                {!aiLoading && (
                  <div className="flex justify-end mt-3">
                    <Button variant="secondary" size="sm" iconLeft={Sparkles} onClick={handleRequestAI}>
                      Regenerate
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  )
}
