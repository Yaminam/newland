import { useState, useEffect, useCallback } from 'react'
import {
  ClipboardCheck, Trash2, Archive, CheckCircle2, Bot, FileText, AlertCircle, Settings,
  ArrowLeft, Activity,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/app/components/ui/Button'
import { Modal } from '@/app/components/ui/Modal'
import { PillTabs } from '@/app/components/ui/PillTabs'
import { DDProgressBar } from './DDProgressBar'
import { DDChecklistItemRow } from './DDChecklistItemRow'
import { DDAddItemForm } from './DDAddItemForm'
import {
  DD_CATEGORIES,
  DD_ITEM_STATUSES,
  type DDChecklist,
  type DDChecklistItem,
  type DDCategory,
} from '@/app/hooks/useDDChecklists'

type AnalysisResult = {
  completeness: Record<string, { score: number; missing: string[] }> | null
  issues: { type: string; item_id: string; message: string }[]
} | null

export interface DDChecklistDetailContentProps {
  checklist: DDChecklist
  variant?: 'drawer' | 'page'
  onBack?: () => void
  /** Called when the checklist is archived/deleted and the view should close. */
  onClose: () => void
  onLoadDetail: (id: string) => Promise<DDChecklist | null>
  onUpdateChecklist: (id: string, updates: Partial<Pick<DDChecklist, 'name' | 'status'>>) => Promise<boolean>
  onDeleteChecklist?: (id: string) => Promise<boolean>
  onAddItem: (checklistId: string, title: string, category: DDCategory, description?: string, dueDate?: string) => Promise<DDChecklistItem | null>
  onUpdateItem: (itemId: string, updates: Partial<Pick<DDChecklistItem, 'notes'>>) => Promise<boolean>
  onToggleItem: (itemId: string, completed: boolean) => Promise<boolean>
  onRemoveItem: (itemId: string) => Promise<boolean>
  onUploadDoc?: (itemId: string, file: File) => Promise<string | null>
  onViewDoc?: (documentPath: string) => Promise<string | null>
  // investor-only actions
  onVerify?: (itemId: string) => Promise<boolean>
  onRequestReupload?: (itemId: string, comment: string) => Promise<boolean>
  onFlag?: (itemId: string, comment?: string) => Promise<boolean>
  onAnalyzeChecklist?: (id: string) => Promise<AnalysisResult>
  onGenerateReport?: (id: string) => Promise<string | null>
  viewMode?: 'investor' | 'founder'
}

type FilterCategory = DDCategory | 'all'

export function DDChecklistDetailContent({
  checklist,
  variant = 'drawer',
  onBack,
  onClose,
  onLoadDetail,
  onUpdateChecklist,
  onDeleteChecklist,
  onAddItem,
  onUpdateItem,
  onToggleItem,
  onRemoveItem,
  onUploadDoc,
  onViewDoc,
  onVerify,
  onRequestReupload,
  onFlag,
  onAnalyzeChecklist,
  onGenerateReport,
  viewMode = 'investor',
}: DDChecklistDetailContentProps) {
  const isFounder = viewMode === 'founder'
  const isInvestor = viewMode === 'investor'
  const isPage = variant === 'page'

  const [detail, setDetail] = useState<DDChecklist | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  // Settings modal state
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editingName, setEditingName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const loadDetail = useCallback(async (id: string) => {
    setLoading(true)
    const data = await onLoadDetail(id)
    setDetail(data)
    setLoading(false)
  }, [onLoadDetail])

  useEffect(() => {
    loadDetail(checklist.id)
    setFilterCategory('all')
  }, [checklist.id, loadDetail])

  const items = detail?.items ?? []
  const filteredItems = filterCategory === 'all' ? items : items.filter(i => i.category === filterCategory)
  const total = items.length
  const completed = items.filter(i => i.status === 'verified').length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const statusCounts: Record<string, number> = {}
  for (const i of items) {
    const key = i.status ?? 'not_started'
    statusCounts[key] = (statusCounts[key] ?? 0) + 1
  }
  const status = detail?.status ?? checklist.status
  const isArchived = status === 'archived'
  const isCompleted = status === 'completed'

  const handleRemoveItem = async (id: string) => {
    await onRemoveItem(id)
    if (detail) loadDetail(detail.id)
  }
  const handleVerify = async (id: string) => {
    if (!onVerify) return false
    const ok = await onVerify(id)
    if (ok && detail) loadDetail(detail.id)
    return ok
  }
  const handleRequestReupload = async (id: string, comment: string) => {
    if (!onRequestReupload) return false
    const ok = await onRequestReupload(id, comment)
    if (ok && detail) loadDetail(detail.id)
    return ok
  }
  const handleFlag = async (id: string, comment?: string) => {
    if (!onFlag) return false
    const ok = await onFlag(id, comment)
    if (ok && detail) loadDetail(detail.id)
    return ok
  }
  const handleAddItem = async (title: string, category: DDCategory, description?: string, dueDate?: string) => {
    if (!detail) return
    await onAddItem(detail.id, title, category, description, dueDate)
    loadDetail(detail.id)
  }
  const handleArchive = async () => {
    if (!detail) return
    setArchiving(true)
    const ok = await onUpdateChecklist(detail.id, { status: 'archived' })
    setArchiving(false)
    if (ok) { toast.success('Checklist archived'); setShowArchiveConfirm(false); onClose() }
  }
  const handleComplete = async () => {
    if (!detail) return
    const ok = await onUpdateChecklist(detail.id, { status: 'completed' })
    if (ok) { toast.success('Checklist marked as completed'); loadDetail(detail.id) }
  }
  const handleAnalyze = async () => {
    if (!detail || !onAnalyzeChecklist) return
    setIsAnalyzing(true)
    try {
      const result = await onAnalyzeChecklist(detail.id)
      setAnalysisResult(result)
      if (result) toast.success('AI analysis complete')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }
  const handleGenerateReport = async () => {
    if (!detail || !onGenerateReport) return
    setIsGeneratingReport(true)
    try {
      const url = await onGenerateReport(detail.id)
      if (url) { window.open(url, '_blank'); toast.success('Report generated') }
      else toast.error('Failed to generate report')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Report generation failed')
    } finally {
      setIsGeneratingReport(false)
    }
  }
  const handleOpenSettings = () => {
    setEditingName(detail?.name ?? checklist.name)
    setShowDeleteConfirm(false)
    setShowArchiveConfirm(false)
    setSettingsOpen(true)
  }
  const handleSaveName = async () => {
    if (!detail || !editingName.trim() || editingName === detail.name) return
    setSavingName(true)
    const ok = await onUpdateChecklist(detail.id, { name: editingName.trim() })
    setSavingName(false)
    if (ok) { toast.success('Checklist renamed'); setDetail({ ...detail, name: editingName.trim() }) }
  }
  const handleDelete = async () => {
    if (!detail || !onDeleteChecklist) return
    setDeleting(true)
    const ok = await onDeleteChecklist(detail.id)
    setDeleting(false)
    if (ok) { toast.success('Checklist deleted'); setSettingsOpen(false); onClose() }
    else toast.error('Failed to delete checklist')
  }

  const categoryOptions: { value: FilterCategory; label: string }[] = [
    { value: 'all', label: `All (${items.length})` },
    ...DD_CATEGORIES
      .filter(c => items.some(i => i.category === c.value))
      .map(c => ({ value: c.value as FilterCategory, label: `${c.label} (${items.filter(i => i.category === c.value).length})` })),
  ]


  /* ── Shared elements ────────────────────────────────────────────── */

  const categoryFilterEl = items.length > 0 && (
    <PillTabs value={filterCategory} options={categoryOptions} onChange={setFilterCategory} />
  )

  const investorHintEl = isInvestor && items.length > 0 && (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--r-md)]" style={{ background: 'var(--blue-bg)', border: '1px solid rgba(37,99,235,0.12)' }}>
      <span className="text-[11px]" style={{ color: 'var(--blue)' }}>
        Need additional documents? Send a message in the Deal Room chat to request them from the founder.
      </span>
    </div>
  )

  const itemsListEl = (
    <div className="rounded-[var(--r-lg)] border border-[var(--line)] overflow-hidden" style={{ background: 'var(--surface)' }}>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-[var(--blue)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-[13px]" style={{ color: 'var(--muted)' }}>
            {isFounder ? 'No items yet. Add your first checklist item below.' : 'No documents shared yet. The founder will add items to this checklist.'}
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-[12px]" style={{ color: 'var(--muted)' }}>No items in this category.</p>
        </div>
      ) : (
        filteredItems.map(item => (
          <DDChecklistItemRow
            key={item.id}
            item={item}
            onRemove={isFounder ? handleRemoveItem : undefined}
            onUploadDoc={isFounder ? onUploadDoc : undefined}
            onViewDoc={onViewDoc}
            onVerify={isInvestor ? handleVerify : undefined}
            onRequestReupload={isInvestor ? handleRequestReupload : undefined}
            onFlag={isInvestor ? handleFlag : undefined}
            viewMode={viewMode}
          />
        ))
      )}
      {isFounder && <DDAddItemForm onAdd={handleAddItem} />}
    </div>
  )

  const categoryBreakdownEl = items.length > 0 && (
    <div className="flex flex-col gap-2">
      {DD_CATEGORIES.filter(c => items.some(i => i.category === c.value)).map(cat => {
        const catItems = items.filter(i => i.category === cat.value)
        const catDone = catItems.filter(i => i.status === 'verified').length
        const catPct = Math.round((catDone / catItems.length) * 100)
        const aiScore = analysisResult?.completeness?.[cat.value]
        return (
          <div key={cat.value} className="flex items-center gap-2">
            <span className="text-[10px] font-semibold w-16 truncate" style={{ color: cat.color }}>{cat.label}</span>
            <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--line)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${catPct}%`, background: cat.color }} />
            </div>
            <span className="text-[10px] font-medium tabular-nums" style={{ color: 'var(--muted)' }}>{catDone}/{catItems.length}</span>
            {aiScore != null && (
              <span
                className="text-[10px] font-bold px-1 rounded"
                style={{
                  background: aiScore.score >= 80 ? 'var(--pos-bg, #dcfce7)' : aiScore.score >= 50 ? 'var(--warn-bg, #fef9c3)' : 'var(--neg-bg, #fee2e2)',
                  color: aiScore.score >= 80 ? 'var(--pos)' : aiScore.score >= 50 ? 'var(--warn)' : 'var(--neg)',
                }}
                title={aiScore.missing.length > 0 ? `Missing: ${aiScore.missing.join(', ')}` : 'Well covered'}
              >
                {aiScore.score}%
              </span>
            )}
          </div>
        )
      })}
    </div>
  )

  const aiPanelEl = analysisResult && (
    <div className="rounded-[var(--r-md)] p-3 flex flex-col gap-2" style={{ background: 'var(--bg-soft)', border: '1px solid var(--line)' }}>
      <div className="flex items-center gap-1.5">
        <Bot className="w-3.5 h-3.5" style={{ color: 'var(--blue)' }} />
        <span className="text-[11px] font-bold" style={{ color: 'var(--blue)' }}>AI Analysis</span>
      </div>
      {analysisResult.completeness && Object.entries(analysisResult.completeness).some(([, v]) => v.missing.length > 0) && (
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>Suggested missing items:</p>
          {Object.entries(analysisResult.completeness).map(([cat, data]) =>
            data.missing.length > 0 ? (
              <div key={cat}>
                <span className="text-[10px] font-bold" style={{ color: 'var(--ink)' }}>{cat.charAt(0).toUpperCase() + cat.slice(1)}: </span>
                <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{data.missing.join(' · ')}</span>
              </div>
            ) : null,
          )}
        </div>
      )}
      {analysisResult.issues.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          <p className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>Issues detected:</p>
          {analysisResult.issues.slice(0, 5).map((issue, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: 'var(--warn)' }} />
              <span className="text-[10px]" style={{ color: 'var(--ink)' }}>{issue.message}</span>
            </div>
          ))}
          {analysisResult.issues.length > 5 && (
            <span className="text-[10px]" style={{ color: 'var(--muted)' }}>+{analysisResult.issues.length - 5} more issues</span>
          )}
        </div>
      )}
      {analysisResult.issues.length === 0 && !Object.values(analysisResult.completeness ?? {}).some(v => v.missing.length > 0) && (
        <p className="text-[10px]" style={{ color: 'var(--pos)' }}>No issues found. Checklist looks comprehensive.</p>
      )}
    </div>
  )

  const settingsModalEl = isFounder && (
    <Modal
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      title="Checklist Settings"
      subtitle={detail?.name}
      footer={
        <div className="flex items-center gap-2 w-full">
          <Button variant="secondary" size="sm" onClick={() => setSettingsOpen(false)}>Close</Button>
          <Button
            variant="primary" size="sm" isLoading={savingName} onClick={handleSaveName}
            disabled={!editingName.trim() || editingName === detail?.name} className="ml-auto"
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--muted-2)' }}>
            Checklist Name
          </label>
          <input
            type="text"
            value={editingName}
            onChange={e => setEditingName(e.target.value)}
            className="w-full h-10 px-3 text-[14px] rounded-[var(--r-md)] border border-[var(--line)] focus:border-[var(--blue)] focus:outline-none transition-colors"
            style={{ background: 'var(--bg)', color: 'var(--ink)' }}
          />
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid var(--line)' }}>
          <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--surface)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--warn) 12%, transparent)' }}>
              <Archive className="w-4 h-4" style={{ color: 'var(--warn)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>Archive Checklist</p>
              <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>Move to archive — can be restored later</p>
            </div>
            {!showArchiveConfirm ? (
              <button onClick={() => setShowArchiveConfirm(true)} className="text-[11px] font-semibold px-2.5 py-1 rounded-md cursor-pointer transition-colors hover:bg-[var(--surface-2)]" style={{ color: 'var(--warn)' }}>Archive</button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setShowArchiveConfirm(false)} className="text-[11px] font-semibold px-2.5 py-1 rounded-md cursor-pointer" style={{ color: 'var(--muted)' }}>Cancel</button>
                <Button variant="secondary" size="sm" onClick={handleArchive} isLoading={archiving}>Confirm</Button>
              </div>
            )}
          </div>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid var(--neg-line, #FCA5A5)' }}>
          <div className="flex items-center gap-3 px-3 py-3" style={{ background: 'var(--surface)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--neg-bg, #FEF2F2)' }}>
              <Trash2 className="w-4 h-4" style={{ color: 'var(--neg)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold" style={{ color: 'var(--neg)' }}>Delete Checklist</p>
              <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>Permanently delete this checklist and all its items</p>
            </div>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)} className="text-[11px] font-semibold px-2.5 py-1 rounded-md cursor-pointer transition-colors hover:bg-[var(--neg-bg)]" style={{ color: 'var(--neg)' }}>Delete</button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setShowDeleteConfirm(false)} className="text-[11px] font-semibold px-2.5 py-1 rounded-md cursor-pointer" style={{ color: 'var(--muted)' }}>Cancel</button>
                <Button variant="secondary" size="sm" onClick={handleDelete} isLoading={deleting}>Confirm Delete</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )

  const canComplete = isFounder && status === 'active' && total > 0 && completed === total

  /* ── PAGE VARIANT ───────────────────────────────────────────────── */
  if (isPage) {
    return (
      <>
        {/* Hero */}
        <div className="hero-gradient" style={{ padding: '16px 22px 18px', marginBottom: 14 }}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-4" style={{ position: 'relative', zIndex: 1 }}>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase cursor-pointer transition-colors"
              style={{ color: 'rgba(255,255,255,0.65)', letterSpacing: '0.07em' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Due Diligence
            </button>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>/</span>
            <span className="text-[11px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 260 }}>
              {detail?.name ?? checklist.name}
            </span>
          </div>

          {/* Identity + actions */}
          <div className="flex items-start justify-between gap-4 flex-wrap" style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-[16px] flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)' }}>
                <ClipboardCheck className="w-6 h-6" style={{ color: '#fff' }} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-[24px] font-bold leading-tight truncate" style={{ color: '#fff', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
                    {detail?.name ?? checklist.name}
                  </h1>
                  <span
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0"
                    style={
                      isCompleted ? { background: 'rgba(34,197,94,0.22)', color: '#86EFAC' }
                        : isArchived ? { background: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.75)' }
                        : { background: 'rgba(96,165,250,0.25)', color: '#BFDBFE' }
                    }
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: isCompleted ? '#4ADE80' : isArchived ? 'rgba(255,255,255,0.6)' : '#93C5FD' }} />
                    {isCompleted ? 'Completed' : isArchived ? 'Archived' : 'Active'}
                  </span>
                </div>
                <p className="text-[13px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {[detail?.startup?.company_name ?? checklist.startup?.company_name, detail?.deal?.pipeline_stage].filter(Boolean).join(' · ') || 'Due diligence checklist'}
                </p>
              </div>
            </div>

            {isFounder && (
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={handleOpenSettings} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97]" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }}>
                  <Settings className="w-3.5 h-3.5" /> Settings
                </button>
                {onAnalyzeChecklist && (
                  <button onClick={handleAnalyze} disabled={isAnalyzing} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97] disabled:opacity-60" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }}>
                    <Bot className="w-3.5 h-3.5" /> {isAnalyzing ? 'Analyzing…' : 'AI Analyze'}
                  </button>
                )}
                {onGenerateReport && (
                  <button onClick={handleGenerateReport} disabled={isGeneratingReport} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97] disabled:opacity-60" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }}>
                    <FileText className="w-3.5 h-3.5" /> {isGeneratingReport ? 'Generating…' : 'Report'}
                  </button>
                )}
                {canComplete && (
                  <button onClick={handleComplete} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12px] font-bold cursor-pointer transition-all active:scale-[0.97]" style={{ background: '#fff', color: '#0D1B2A' }}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Two-column workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
          {/* Main */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--sh-2)' }} className="p-4 min-w-0 self-start">
            <div className="flex flex-col gap-4">
              {investorHintEl}
              {categoryFilterEl}
              {itemsListEl}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Progress */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--sh-2)' }} className="p-4">
              {/* Completion */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[8px] flex items-center justify-center" style={{ background: pct === 100 ? 'var(--pos-bg, #F0FDF4)' : 'var(--blue-bg)' }}>
                    <Activity className="w-4 h-4" style={{ color: pct === 100 ? 'var(--pos)' : 'var(--blue)' }} />
                  </div>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>Progress</p>
                </div>
                <span className="text-[13px] font-bold tabular-nums" style={{ color: pct === 100 ? 'var(--pos)' : 'var(--blue)' }}>{pct}%</span>
              </div>
              <div className="mb-1"><DDProgressBar completed={completed} total={total} /></div>
              <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>{completed} of {total} items verified</p>

              {items.length > 0 && (
                <>
                  {/* By status (new — replaces the duplicated stat tiles) */}
                  <p className="text-[11px] font-bold uppercase mt-4 mb-2" style={{ color: 'var(--muted-2)', letterSpacing: '0.05em' }}>By Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DD_ITEM_STATUSES.filter(s => statusCounts[s.value]).map(s => (
                      <span
                        key={s.value}
                        className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full"
                        style={{ background: `color-mix(in srgb, ${s.color} 12%, transparent)`, color: s.color }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                        {s.label} {statusCounts[s.value]}
                      </span>
                    ))}
                  </div>

                  {/* By category */}
                  <p className="text-[11px] font-bold uppercase mt-4 mb-2" style={{ color: 'var(--muted-2)', letterSpacing: '0.05em' }}>By Category</p>
                  {categoryBreakdownEl}
                </>
              )}

              {/* AI analysis (inline when available) */}
              {aiPanelEl && <div className="mt-4">{aiPanelEl}</div>}
            </div>

            {/* Details */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--sh-2)' }} className="p-4">
              <p className="text-[13px] font-semibold mb-3" style={{ color: 'var(--ink)' }}>Checklist Details</p>
              <dl className="space-y-2.5 text-[12px]">
                {[
                  { label: 'Status', value: isCompleted ? 'Completed' : isArchived ? 'Archived' : 'Active' },
                  { label: 'Startup', value: detail?.startup?.company_name ?? checklist.startup?.company_name ?? '—' },
                  { label: 'Stage', value: detail?.deal?.pipeline_stage ?? '—' },
                  { label: 'Items', value: `${completed}/${total} verified` },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between gap-3">
                    <span style={{ color: 'var(--muted-2)' }}>{row.label}</span>
                    <span className="font-semibold text-right truncate" style={{ color: 'var(--ink)' }}>{row.value}</span>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        </div>

        {settingsModalEl}
      </>
    )
  }

  /* ── DRAWER VARIANT (compact body — chrome provided by wrapper) ──── */
  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Action toolbar */}
        {isFounder && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" size="sm" iconLeft={Settings} onClick={handleOpenSettings}>Settings</Button>
            {onAnalyzeChecklist && (
              <Button variant="secondary" size="sm" iconLeft={Bot} onClick={handleAnalyze} disabled={isAnalyzing}>{isAnalyzing ? 'Analyzing…' : 'AI Analyze'}</Button>
            )}
            {onGenerateReport && (
              <Button variant="secondary" size="sm" iconLeft={FileText} onClick={handleGenerateReport} disabled={isGeneratingReport}>{isGeneratingReport ? 'Generating…' : 'Report'}</Button>
            )}
            {canComplete && (
              <Button variant="primary" size="sm" iconLeft={CheckCircle2} onClick={handleComplete} className="ml-auto">Mark Complete</Button>
            )}
          </div>
        )}

        {/* Header info */}
        <div className="flex items-center gap-3 p-3 rounded-[var(--r-md)]" style={{ background: 'var(--bg-soft)' }}>
          <div className="w-10 h-10 rounded-[var(--r-md)] flex items-center justify-center" style={{ background: 'var(--blue-bg)' }}>
            <ClipboardCheck className="w-5 h-5" style={{ color: 'var(--blue)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>{detail?.name ?? checklist.name}</p>
            <div className="flex items-center gap-2 mt-1">
              {(detail?.startup?.company_name) && <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{detail.startup.company_name}</span>}
              {detail?.deal?.pipeline_stage && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-soft)', color: 'var(--muted)' }}>{detail.deal.pipeline_stage}</span>}
              {status !== 'active' && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: isCompleted ? 'var(--pos-bg, #dcfce7)' : 'var(--surface-2)', color: isCompleted ? 'var(--pos)' : 'var(--muted)' }}>{status}</span>
              )}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-2)' }}>Progress</p>
            <span className="text-[12px] font-semibold" style={{ color: pct === 100 ? 'var(--pos)' : 'var(--ink)' }}>{pct}%</span>
          </div>
          <DDProgressBar completed={completed} total={total} />
          {categoryBreakdownEl && <div className="mt-2">{categoryBreakdownEl}</div>}
          {aiPanelEl && <div className="mt-3">{aiPanelEl}</div>}
        </div>

        {categoryFilterEl}
        {investorHintEl}
        {itemsListEl}
      </div>

      {settingsModalEl}
    </>
  )
}
