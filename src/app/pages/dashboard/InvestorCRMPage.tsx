import { useState, useMemo, useCallback } from 'react'
import { SEO } from '@/app/components/SEO'
import { motion } from 'framer-motion'
import { Users, Download, Plus, Trash2, ArrowRight, X, LayoutGrid, List, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { useCRM, CRM_STAGES, type CRMContact, type CRMStageKey } from '@/app/hooks/useCRM'
import { HeroSection } from '@/app/components/ui/HeroSection'
import { SearchInput } from '@/app/components/ui/SearchInput'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'
import { CRMKanbanBoard } from '@/app/components/crm/CRMKanbanBoard'
import { CRMListView } from '@/app/components/crm/CRMListView'
import { CRMContactDrawer } from '@/app/components/crm/CRMContactDrawer'
import { AddInvestorModal } from '@/app/components/crm/AddInvestorModal'
import { CalendarSettings } from '@/app/components/crm/CalendarSettings'

type ViewMode = 'kanban' | 'list' | 'calendar'

const VIEW_OPTIONS: { value: ViewMode; label: string; icon: React.ElementType }[] = [
  { value: 'kanban', label: 'Board', icon: LayoutGrid },
  { value: 'list', label: 'List', icon: List },
  { value: 'calendar', label: 'Calendar', icon: Calendar },
]

export function InvestorCRMPage() {
  const {
    contacts,
    interactions,
    reminders,
    stageCounts,
    grouped,
    isLoading,
    moveContactStage,
    updateContact,
    deleteContact,
    addContact,
    addInteraction,
    addReminder,
    completeReminder,
    loadInteractions,
    loadReminders,
    getAISummary,
    bulkMoveStage,
    bulkDelete,
    exportCSV,
    calendarConnections,
    calendarEvents,
    connectCalendar,
    disconnectCalendar,
    syncCalendar,
    loadCalendarEvents,
  } = useCRM()

  const [view, setView] = useState<ViewMode>('kanban')
  const [search, setSearch] = useState('')
  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts
    const q = search.toLowerCase()
    return contacts.filter(c => {
      const name = c.display_name?.toLowerCase() ?? ''
      const firm = c.firm_name?.toLowerCase() ?? ''
      const tags = (c.tags ?? []).join(' ').toLowerCase()
      const email = c.email?.toLowerCase() ?? ''
      return name.includes(q) || firm.includes(q) || tags.includes(q) || email.includes(q)
    })
  }, [contacts, search])

  const filteredGrouped = useMemo(() => {
    const map: Record<string, CRMContact[]> = {}
    const stages = ['cold', 'warm', 'pitched', 'in_dd', 'term_sheet', 'closed']
    for (const s of stages) map[s] = []
    for (const c of filteredContacts) {
      if (!map[c.stage]) map[c.stage] = []
      map[c.stage].push(c)
    }
    return map
  }, [filteredContacts])

  const handleCardClick = (contact: CRMContact) => {
    setSelectedContact(contact)
    setDrawerOpen(true)
  }

  const handleAddContact: typeof addContact = async (contact) => {
    const result = await addContact(contact)
    if (result) {
      setSelectedContact(result as CRMContact)
      setDrawerOpen(true)
    }
    return result
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(filteredContacts.map(c => c.id)))
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleBulkMove = async (stage: CRMStageKey) => {
    const ids = Array.from(selectedIds)
    const ok = await bulkMoveStage(ids, stage)
    if (ok) {
      toast.success(`${ids.length} contact${ids.length > 1 ? 's' : ''} moved to ${CRM_STAGES.find(s => s.key === stage)?.label}`)
      clearSelection()
    } else {
      toast.error('Failed to move contacts')
    }
  }

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds)
    if (!confirm(`Delete ${ids.length} contact${ids.length > 1 ? 's' : ''}? This cannot be undone.`)) return
    const ok = await bulkDelete(ids)
    if (ok) {
      toast.success(`${ids.length} contact${ids.length > 1 ? 's' : ''} removed`)
      clearSelection()
    } else {
      toast.error('Failed to delete contacts')
    }
  }

  const handleExport = () => {
    exportCSV()
    toast.success('CRM exported as CSV')
  }

  /* -- Hero stats -- */
  const heroStats = useMemo(() => {
    const total = contacts.length
    const warm = (stageCounts['warm'] ?? 0) + (stageCounts['pitched'] ?? 0)
    const inDD = stageCounts['in_dd'] ?? 0
    const closed = stageCounts['closed'] ?? 0
    return [
      { label: 'Total', value: total },
      { label: 'Active', value: warm },
      { label: 'In DD', value: inDD },
      { label: 'Closed', value: closed },
    ]
  }, [contacts.length, stageCounts])

  if (isLoading) {
    return (
      <div className="p-1">
        <SkeletonBlock height={160} className="mb-6" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonBlock key={i} width={260} height={360} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO title="Watchlist" />

      {/* ── Hero ─────────────────────────────────────────── */}
      <HeroSection
        eyebrow="Watchlist"
        title="Your Watchlist"
        subtitle="Track every investor relationship from first touch to close."
        stats={heroStats}
      >
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97]"
            style={{
              background: 'rgba(255,255,255,0.10)',
              color: 'rgba(255,255,255,0.80)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97]"
            style={{
              background: 'rgba(255,255,255,0.90)',
              color: '#1e293b',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Investor
          </button>
        </div>
      </HeroSection>

      {/* ── Toolbar ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.25 }}
        className="flex items-center gap-3 mb-5 flex-wrap px-1"
      >
        {/* View tabs */}
        <div
          className="inline-flex items-center gap-1 p-1 rounded-[10px]"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
        >
          {VIEW_OPTIONS.map(opt => {
            const active = view === opt.value
            const Icon = opt.icon
            return (
              <button
                key={opt.value}
                onClick={() => setView(opt.value)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold cursor-pointer transition-all"
                style={{
                  background: active ? 'var(--blue)' : 'transparent',
                  color: active ? '#fff' : 'var(--muted)',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="flex-1 min-w-0 sm:max-w-[280px]">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, firm, tag…"
            className="w-full"
            resultCount={search ? filteredContacts.length : undefined}
          />
        </div>

        {/* Stage pills — desktop only, quick filter summary */}
        <div className="hidden lg:flex items-center gap-1.5 ml-auto">
          {CRM_STAGES.map(s => (
            <div
              key={s.key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: `${s.color}10` }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: s.color }}
              />
              <span className="text-[11px] font-semibold" style={{ color: s.color }}>
                {stageCounts[s.key] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Bulk actions ─────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-4 mx-1 px-4 py-3 rounded-[12px] flex-wrap"
          style={{ background: 'var(--blue-bg)', border: '1px solid rgba(37,99,235,0.15)' }}
        >
          <span className="text-[13px] font-semibold" style={{ color: 'var(--blue)' }}>
            {selectedIds.size} selected
          </span>
          <button
            onClick={clearSelection}
            className="text-[12px] font-medium flex items-center gap-1 cursor-pointer"
            style={{ color: 'var(--muted)' }}
          >
            <X className="w-3 h-3" /> Clear
          </button>
          <button
            onClick={selectAll}
            className="text-[12px] font-medium cursor-pointer"
            style={{ color: 'var(--blue)' }}
          >
            Select all ({filteredContacts.length})
          </button>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium hidden sm:inline" style={{ color: 'var(--muted)' }}>
              <ArrowRight className="w-3 h-3 inline" /> Move to:
            </span>
            {CRM_STAGES.map(s => (
              <button
                key={s.key}
                onClick={() => handleBulkMove(s.key)}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-full cursor-pointer transition-all hover:opacity-80 active:scale-[0.96]"
                style={{ background: `${s.color}18`, color: s.color }}
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={handleBulkDelete}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-full cursor-pointer flex items-center gap-1 transition-all hover:opacity-80 active:scale-[0.96]"
              style={{ background: 'var(--neg-bg)', color: 'var(--neg)' }}
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Content ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="px-1"
      >
        {contacts.length === 0 ? (
          <EmptyState
            icon={<Users className="w-7 h-7" style={{ color: 'var(--blue)' }} />}
            title="No investors tracked yet"
            description="Start building your investor pipeline by adding investors from the marketplace or manually."
            action={{
              label: 'Add Investor',
              onClick: () => setAddModalOpen(true),
            }}
          />
        ) : view === 'calendar' ? (
          <CalendarSettings
            connections={calendarConnections}
            events={calendarEvents}
            onConnect={connectCalendar}
            onDisconnect={disconnectCalendar}
            onSync={syncCalendar}
            onLoadEvents={loadCalendarEvents}
          />
        ) : view === 'kanban' ? (
          <CRMKanbanBoard
            grouped={filteredGrouped}
            stageCounts={stageCounts}
            onMoveStage={moveContactStage}
            onCardClick={handleCardClick}
            onAddContact={() => setAddModalOpen(true)}
          />
        ) : (
          <CRMListView
            contacts={filteredContacts}
            onRowClick={handleCardClick}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        )}
      </motion.div>

      {/* Contact detail drawer */}
      <CRMContactDrawer
        contact={selectedContact}
        interactions={interactions}
        reminders={reminders}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdate={updateContact}
        onMoveStage={moveContactStage}
        onDelete={deleteContact}
        onAddInteraction={addInteraction}
        onAddReminder={addReminder}
        onCompleteReminder={completeReminder}
        onLoadInteractions={loadInteractions}
        onLoadReminders={loadReminders}
        onGetAISummary={getAISummary}
      />

      {/* Add investor modal */}
      <AddInvestorModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddContact}
      />
    </>
  )
}
