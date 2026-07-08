import { useState, useMemo, useEffect } from 'react'
import { SEO } from '@/app/components/SEO'
import { motion } from 'framer-motion'
import { FileText, Plus, Sparkles, Store, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useTermSheets, type TermSheet, type TermSheetTemplate } from '@/app/hooks/useTermSheets'
import { HeroSection } from '@/app/components/ui/HeroSection'
import { SearchInput } from '@/app/components/ui/SearchInput'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { SkeletonBlock } from '@/app/components/ui/Skeleton'
import { useAuth } from '@/app/context/AuthContext'
import { TermSheetCard } from '@/app/components/term-sheets/TermSheetCard'
import { TemplateCard } from '@/app/components/term-sheets/TemplateCard'
import { TermSheetDrawer } from '@/app/components/term-sheets/TermSheetDrawer'
import { GenerateAIModal } from '@/app/components/term-sheets/GenerateAIModal'
import { CreateTermSheetModal } from '@/app/components/term-sheets/CreateTermSheetModal'

type ViewTab = 'sheets' | 'templates' | 'marketplace'

const TAB_OPTIONS: { value: ViewTab; label: string }[] = [
  { value: 'sheets', label: 'My Sheets' },
  { value: 'templates', label: 'Templates' },
  { value: 'marketplace', label: 'Marketplace' },
]

export function TermSheetsPage() {
  const { profile } = useAuth()
  const isFounder = profile?.role === 'founder'
  const {
    termSheets,
    systemTemplates,
    userTemplates,
    isLoading,
    createTermSheet,
    updateTermSheet,
    deleteTermSheet,
    generateAI,
    generatePDF,
    createTemplate,
    deleteTemplate,
    marketplaceTemplates,
    loadMarketplaceTemplates,
    shareTemplate,
    unshareTemplate,
    cloneTemplate,
    comments,
    loadComments,
    addComment,
    resolveComment,
    versions,
    loadVersions,
    restoreVersion,
    scoreFairness,
    analyzeWithAI,
    encryptTermSheet,
    decryptTermSheet,
    signatures,
    requestSignature,
    signTermSheet,
    declineSignature,
    loadSignatures,
  } = useTermSheets()

  const [tab, setTab] = useState<ViewTab>('sheets')
  const [search, setSearch] = useState('')
  const [marketplaceSearch, setMarketplaceSearch] = useState('')
  const [selectedSheet, setSelectedSheet] = useState<TermSheet | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  useEffect(() => {
    if (tab === 'marketplace') loadMarketplaceTemplates()
  }, [tab, loadMarketplaceTemplates])

  const filteredMarketplace = useMemo(() => {
    if (!marketplaceSearch.trim()) return marketplaceTemplates
    const q = marketplaceSearch.toLowerCase()
    return marketplaceTemplates.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.creator_name?.toLowerCase().includes(q) ||
      t.fund_type?.toLowerCase().includes(q),
    )
  }, [marketplaceTemplates, marketplaceSearch])

  const filteredSheets = useMemo(() => {
    if (!search.trim()) return termSheets
    const q = search.toLowerCase()
    return termSheets.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.startup?.company_name?.toLowerCase().includes(q) ||
      s.investor?.full_name?.toLowerCase().includes(q),
    )
  }, [termSheets, search])

  const fairness = useMemo(() => {
    if (!selectedSheet) return undefined
    return scoreFairness(selectedSheet.terms ?? {}, selectedSheet.round_type)
  }, [selectedSheet, scoreFairness])

  const handleCardClick = (sheet: TermSheet) => {
    setSelectedSheet(sheet)
    setDrawerOpen(true)
  }

  const handleUseTemplate = async (template: typeof systemTemplates[0]) => {
    const sheet = await createTermSheet(template.name, template.round_type, template.terms)
    if (sheet) {
      toast.success('Term sheet created from template')
      setSelectedSheet(sheet as TermSheet)
      setDrawerOpen(true)
    } else {
      toast.error('Failed to create term sheet')
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return
    const ok = await deleteTemplate(id)
    if (ok) toast.success('Template deleted')
    else toast.error('Failed to delete')
  }

  const handleShareTemplate = async (id: string) => {
    const ok = await shareTemplate(id)
    if (ok) toast.success('Template shared to marketplace!')
    else toast.error('Failed to share')
  }

  const handleUnshareTemplate = async (id: string) => {
    const ok = await unshareTemplate(id)
    if (ok) toast.success('Template removed from marketplace')
    else toast.error('Failed to unshare')
  }

  const handleCloneTemplate = async (t: TermSheetTemplate) => {
    const result = await cloneTemplate(t.id)
    if (result) toast.success(`"${t.name}" cloned to your templates`)
    else toast.error('Failed to clone template')
  }

  const handleAIGenerated = async (terms: Record<string, string>, roundType: string) => {
    const sheet = await createTermSheet(
      `AI Term Sheet - ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      roundType,
      terms,
      { aiGenerated: true },
    )
    if (sheet) {
      toast.success('AI term sheet created')
      setSelectedSheet(sheet as TermSheet)
      setDrawerOpen(true)
    }
  }

  const handleAnalyzeClause = async (termSheetId: string, clauseKey: string): Promise<string | null> => {
    const result = await analyzeWithAI(termSheetId, 'explain')
    if (!result) return null
    return result.explanations[clauseKey] ?? null
  }

  const handleCreateBlank = async (name: string, roundType: string) => {
    const sheet = await createTermSheet(name, roundType, {})
    if (sheet) {
      toast.success('Term sheet created')
      setSelectedSheet(sheet as TermSheet)
      setDrawerOpen(true)
    }
  }

  /* -- Hero stats -- */
  const drafts = termSheets.filter(s => s.status === 'draft').length
  const finals = termSheets.filter(s => s.status === 'final').length
  const templateCount = systemTemplates.length + userTemplates.length

  if (isLoading) {
    return (
      <div className="p-1">
        <SkeletonBlock height={160} className="mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonBlock key={i} height={150} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO title="Term Sheets" />

      {/* ── Hero ─────────────────────────────────────────── */}
      <HeroSection
        eyebrow="Term Sheets"
        title="Draft & Negotiate"
        subtitle="Create, analyze, and manage term sheets with AI assistance."
        stats={[
          { label: 'Total', value: termSheets.length },
          { label: 'Drafts', value: drafts },
          { label: 'Final', value: finals },
          { label: 'Templates', value: templateCount },
        ]}
      >
        {isFounder && (
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => setAiModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97]"
              style={{
                background: 'rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.80)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate with AI
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97]"
              style={{
                background: 'rgba(255,255,255,0.90)',
                color: '#1e293b',
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Create Blank
            </button>
          </div>
        )}
      </HeroSection>

      {/* ── Toolbar ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.25 }}
        className="flex items-center gap-3 mb-5 flex-wrap px-1"
      >
        {/* Tabs */}
        <div
          className="inline-flex items-center gap-1 p-1 rounded-[10px]"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
        >
          {TAB_OPTIONS.map(opt => {
            const active = tab === opt.value
            const count = opt.value === 'sheets' ? termSheets.length
              : opt.value === 'templates' ? templateCount
              : marketplaceTemplates.length
            return (
              <button
                key={opt.value}
                onClick={() => setTab(opt.value)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold cursor-pointer transition-all"
                style={{
                  background: active ? 'var(--blue)' : 'transparent',
                  color: active ? '#fff' : 'var(--muted)',
                }}
              >
                {opt.label}
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: active ? 'rgba(255,255,255,0.20)' : 'var(--surface-3)',
                    color: active ? '#fff' : 'var(--muted-2)',
                  }}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        {tab === 'sheets' && (
          <div className="flex-1 min-w-0 sm:max-w-[280px]">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by name, startup…"
              className="w-full"
              resultCount={search ? filteredSheets.length : undefined}
            />
          </div>
        )}
        {tab === 'marketplace' && (
          <div className="flex-1 min-w-0 sm:max-w-[280px]">
            <SearchInput
              value={marketplaceSearch}
              onChange={setMarketplaceSearch}
              placeholder="Search templates…"
              className="w-full"
              resultCount={marketplaceSearch ? filteredMarketplace.length : undefined}
            />
          </div>
        )}
      </motion.div>

      {/* ── Content ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="px-1"
      >
        {/* ─ My Sheets ─ */}
        {tab === 'sheets' && (
          <>
            {termSheets.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-7 h-7" style={{ color: 'var(--blue)' }} />}
                title="No term sheets yet"
                description={
                  isFounder
                    ? 'Generate a term sheet with AI, create from a template, or start blank.'
                    : 'Term sheets created by founders you\'re connected with will appear here.'
                }
                action={isFounder ? { label: 'Generate with AI', onClick: () => setAiModalOpen(true) } : undefined}
              />
            ) : filteredSheets.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-7 h-7" style={{ color: 'var(--blue)' }} />}
                title="No matching term sheets"
                description="Try adjusting your search."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredSheets.map((sheet, i) => (
                  <motion.div
                    key={sheet.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.3 }}
                  >
                    <TermSheetCard sheet={sheet} onClick={() => handleCardClick(sheet)} />
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─ Templates ─ */}
        {tab === 'templates' && (
          <div className="flex flex-col gap-6">
            {/* System templates */}
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-wider mb-3"
                style={{ color: 'var(--muted-2)' }}
              >
                System Templates
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {systemTemplates.map(t => (
                  <TemplateCard key={t.id} template={t} onUse={() => handleUseTemplate(t)} />
                ))}
              </div>
            </div>

            {/* User templates */}
            {userTemplates.length > 0 && (
              <div>
                <p
                  className="text-[11px] font-bold uppercase tracking-wider mb-3"
                  style={{ color: 'var(--muted-2)' }}
                >
                  My Templates
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {userTemplates.map(t => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      onUse={() => handleUseTemplate(t)}
                      onDelete={() => handleDeleteTemplate(t.id)}
                      onShare={t.is_shared ? undefined : () => handleShareTemplate(t.id)}
                      onUnshare={t.is_shared ? () => handleUnshareTemplate(t.id) : undefined}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─ Marketplace ─ */}
        {tab === 'marketplace' && (
          <>
            {filteredMarketplace.length === 0 ? (
              <EmptyState
                icon={<Store className="w-7 h-7" style={{ color: 'var(--blue)' }} />}
                title="No marketplace templates yet"
                description="Share your own templates to see them here, or wait for the community to contribute."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredMarketplace.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.3 }}
                  >
                    <div
                      className="flex flex-col gap-3 transition-all active:scale-[0.97]"
                      style={{
                        background: 'var(--surface)',
                        borderRadius: 16,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        padding: '20px',
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                            {t.name}
                          </p>
                          {t.description && (
                            <p className="text-[12px] mt-1 line-clamp-2" style={{ color: 'var(--muted)' }}>
                              {t.description}
                            </p>
                          )}
                        </div>
                        {t.fund_type && (
                          <span
                            className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
                          >
                            {t.fund_type.replace('_', ' ').toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>
                          by {t.creator_name ?? 'Anonymous'}
                        </span>
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--surface-3)', color: 'var(--muted-2)' }}
                        >
                          {Object.keys(t.terms ?? {}).length} clauses
                        </span>
                        {t.usage_count > 0 && (
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--surface-3)', color: 'var(--muted-2)' }}
                          >
                            {t.usage_count} use{t.usage_count === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-auto pt-3" style={{ borderTop: '1px solid var(--line-2)' }}>
                        <button
                          onClick={() => handleCloneTemplate(t)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97]"
                          style={{ background: 'var(--blue)', color: '#fff' }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Clone
                        </button>
                        <button
                          onClick={() => handleUseTemplate(t)}
                          className="px-3 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97]"
                          style={{ background: 'var(--surface-3)', color: 'var(--muted)' }}
                        >
                          Use
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Term sheet detail drawer */}
      <TermSheetDrawer
        sheet={selectedSheet}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdate={updateTermSheet}
        onDelete={deleteTermSheet}
        onGeneratePDF={generatePDF}
        onCreateTemplate={createTemplate}
        comments={comments}
        onLoadComments={loadComments}
        onAddComment={addComment}
        onResolveComment={resolveComment}
        fairnessScores={fairness?.clauses}
        versions={versions}
        onLoadVersions={loadVersions}
        onRestoreVersion={restoreVersion}
        onAnalyze={isFounder ? handleAnalyzeClause : undefined}
        onEncrypt={encryptTermSheet}
        onDecrypt={decryptTermSheet}
        signatures={signatures}
        onLoadSignatures={loadSignatures}
        onRequestSignature={requestSignature}
        onSign={signTermSheet}
        onDeclineSignature={declineSignature}
        currentUserId={profile?.id}
      />

      {/* AI generation modal */}
      <GenerateAIModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onGenerate={generateAI}
        onTermsGenerated={handleAIGenerated}
      />

      {/* Create blank modal */}
      <CreateTermSheetModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateBlank}
      />
    </>
  )
}
