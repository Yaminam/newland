import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { SEO } from '@/app/components/SEO'
import { motion } from 'framer-motion'
import { ClipboardCheck, Plus, Send, Inbox } from 'lucide-react'
import { toast } from 'sonner'
import { useDDChecklists, type DDChecklist } from '@/app/hooks/useDDChecklists'
import { useDDRequests } from '@/app/hooks/useDDRequests'
import { PageHeader } from '@/app/components/ui/PageHeader'
import { PillTabs } from '@/app/components/ui/PillTabs'
import { Button } from '@/app/components/ui/Button'
import { SearchInput } from '@/app/components/ui/SearchInput'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'
import { DDChecklistCard } from '@/app/components/dd-checklist/DDChecklistCard'
import { DDTemplateCard } from '@/app/components/dd-checklist/DDTemplateCard'
import { DDRequestCard } from '@/app/components/dd-checklist/DDRequestCard'
import { CreateDDChecklistModal } from '@/app/components/dd-checklist/CreateDDChecklistModal'
import { SendDDRequestModal } from '@/app/components/dd-checklist/SendDDRequestModal'

type FounderTab = 'checklists' | 'requests' | 'templates'
type InvestorTab = 'checklists' | 'requests'

export function DDChecklistPage() {
  const navigate = useNavigate()
  const {
    checklists, templates, systemTemplates, userTemplates, isLoading: checklistLoading,
    isInvestor, isFounder,
    createChecklist, deleteTemplate,
  } = useDDChecklists()

  const {
    requests, pendingRequests, isLoading: requestsLoading,
    sendRequest, respondToRequest, cancelRequest,
  } = useDDRequests()

  const [tab, setTab] = useState<string>('checklists')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [initialTemplateId, setInitialTemplateId] = useState<string | undefined>()

  const isLoading = checklistLoading || requestsLoading

  const filteredChecklists = useMemo(() => {
    if (!search.trim()) return checklists
    const q = search.toLowerCase()
    return checklists.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.startup?.company_name?.toLowerCase().includes(q),
    )
  }, [checklists, search])

  const handleCardClick = (checklist: DDChecklist) => {
    navigate(`/dashboard/dd-checklist/${checklist.id}`)
  }

  const handleOpenChecklist = (checklistId: string) => {
    navigate(`/dashboard/dd-checklist/${checklistId}`)
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return
    const ok = await deleteTemplate(id)
    if (ok) toast.success('Template deleted')
    else toast.error('Failed to delete')
  }

  const handleAcceptRequest = async (id: string) => {
    const ok = await respondToRequest(id, 'accept')
    if (ok) toast.success('DD request accepted — checklist created')
    else toast.error('Failed to accept')
  }

  const handleRejectRequest = async (id: string) => {
    if (!confirm('Decline this DD request?')) return
    const ok = await respondToRequest(id, 'reject')
    if (ok) toast.success('DD request declined')
    else toast.error('Failed to decline')
  }

  const handleCancelRequest = async (id: string) => {
    if (!confirm('Cancel this DD request?')) return
    const ok = await cancelRequest(id)
    if (ok) toast.success('Request cancelled')
    else toast.error('Failed to cancel')
  }

  const viewMode = isFounder ? 'founder' : 'investor'

  if (isLoading) {
    return (
      <div className="p-1">
        <SkeletonBlock height={40} className="mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonBlock key={i} height={140} />)}
        </div>
      </div>
    )
  }

  /* ── Tab config based on role ──────────────────────────────── */
  const tabOptions = isFounder
    ? [
        { value: 'checklists' as FounderTab, label: `Checklists (${checklists.length})` },
        { value: 'requests' as FounderTab, label: `Requests (${pendingRequests.length})` },
        { value: 'templates' as FounderTab, label: `Templates (${templates.length})` },
      ]
    : [
        { value: 'checklists' as InvestorTab, label: `Checklists (${checklists.length})` },
        { value: 'requests' as InvestorTab, label: `Requests (${requests.length})` },
      ]

  return (
    <>
      <SEO title="DD Checklists" />

      <PageHeader
        title="Due Diligence"
        subtitle={
          isFounder
            ? `${checklists.length} checklist${checklists.length === 1 ? '' : 's'}${pendingRequests.length > 0 ? ` · ${pendingRequests.length} pending` : ''}`
            : `${checklists.length} checklist${checklists.length === 1 ? '' : 's'}`
        }
        icon={<ClipboardCheck className="w-5 h-5" />}
        action={
          isFounder ? (
            <Button variant="primary" size="sm" iconLeft={Plus} onClick={() => setCreateOpen(true)}>
              Create Checklist
            </Button>
          ) : isInvestor ? (
            <Button variant="primary" size="sm" iconLeft={Send} onClick={() => setSendModalOpen(true)}>
              Request DD
            </Button>
          ) : undefined
        }
      />

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.25 }}
        className="flex items-center gap-3 mb-5 flex-wrap"
      >
        <PillTabs value={tab} options={tabOptions} onChange={setTab} />
        {tab === 'checklists' && (
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search checklists…"
            className="w-72"
            resultCount={search ? filteredChecklists.length : undefined}
          />
        )}
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {/* ── Checklists tab ──────────────────────────────────── */}
        {tab === 'checklists' && (
          <>
            {checklists.length === 0 ? (
              <EmptyState
                icon={<ClipboardCheck className="w-7 h-7" style={{ color: 'var(--blue)' }} />}
                title="No DD checklists yet"
                description={
                  isFounder
                    ? 'Create a checklist to share due diligence documents with investors.'
                    : 'Checklists will appear here when a founder shares due diligence documents with you. You can also request DD from a founder.'
                }
                action={
                  isFounder
                    ? { label: 'Create Checklist', onClick: () => setCreateOpen(true) }
                    : { label: 'Request DD', onClick: () => setSendModalOpen(true) }
                }
              />
            ) : filteredChecklists.length === 0 ? (
              <EmptyState
                icon={<ClipboardCheck className="w-7 h-7" style={{ color: 'var(--blue)' }} />}
                title="No matching checklists"
                description="Try adjusting your search."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredChecklists.map(c => (
                  <DDChecklistCard key={c.id} checklist={c} onClick={() => handleCardClick(c)} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Requests tab (both roles) ──────────────────────── */}
        {tab === 'requests' && (
          <>
            {requests.length === 0 ? (
              <EmptyState
                icon={<Inbox className="w-7 h-7" style={{ color: 'var(--blue)' }} />}
                title={isFounder ? 'No DD requests' : 'No requests sent'}
                description={
                  isFounder
                    ? 'When an investor requests due diligence, it will appear here.'
                    : 'Send a DD request to a founder to start the due diligence process.'
                }
                action={isInvestor ? { label: 'Request DD', onClick: () => setSendModalOpen(true) } : undefined}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requests.map(r => (
                  <DDRequestCard
                    key={r.id}
                    request={r}
                    viewMode={viewMode}
                    onAccept={handleAcceptRequest}
                    onReject={handleRejectRequest}
                    onCancel={handleCancelRequest}
                    onOpenChecklist={handleOpenChecklist}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Templates tab (founder only) ────────────────────── */}
        {tab === 'templates' && isFounder && (
          <div className="flex flex-col gap-6">
            {systemTemplates.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-2)' }}>
                  System Templates
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {systemTemplates.map(t => (
                    <DDTemplateCard key={t.id} template={t} onUse={() => setCreateOpen(true)} />
                  ))}
                </div>
              </div>
            )}
            {userTemplates.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-2)' }}>
                  My Templates
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userTemplates.map(t => (
                    <DDTemplateCard
                      key={t.id}
                      template={t}
                      onUse={() => setCreateOpen(true)}
                      onDelete={() => handleDeleteTemplate(t.id)}
                    />
                  ))}
                </div>
              </div>
            )}
            {systemTemplates.length === 0 && userTemplates.length === 0 && (
              <EmptyState
                icon={<ClipboardCheck className="w-7 h-7" style={{ color: 'var(--blue)' }} />}
                title="No templates available"
                description="Templates help you quickly create checklists with pre-filled items."
              />
            )}
          </div>
        )}
      </motion.div>

      {/* Create checklist modal (founder only) */}
      {isFounder && (
        <CreateDDChecklistModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          templates={templates}
          onCreate={createChecklist}
        />
      )}

      {/* Send DD request modal (investor only) */}
      {isInvestor && (
        <SendDDRequestModal
          open={sendModalOpen}
          onClose={() => { setSendModalOpen(false); setInitialTemplateId(undefined) }}
          templates={templates}
          initialTemplateId={initialTemplateId}
          onSend={sendRequest}
        />
      )}
    </>
  )
}
