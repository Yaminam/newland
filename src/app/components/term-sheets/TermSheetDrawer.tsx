import { useState, useEffect } from 'react'
import { FileText, Download, Trash2, Save, Sparkles, BookMarked, Shield, Lock, PenTool, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/app/components/ui/Modal'
import { Button } from '@/app/components/ui/Button'
import { TermSheetEditor } from './TermSheetEditor'
import { CreateTemplateModal } from './CreateTemplateModal'
import { VersionHistory } from './VersionHistory'
import { ROUND_TYPES, type TermSheet, type TermSheetComment, type TermSheetVersion, type SignatureRequest } from '@/app/hooks/useTermSheets'

interface Props {
  sheet: TermSheet | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (id: string, updates: Partial<Pick<TermSheet, 'name' | 'status' | 'terms'>>) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
  onGeneratePDF: (id: string) => Promise<string | null>
  onCreateTemplate: (name: string, roundType: string, terms: Record<string, string>, description?: string) => Promise<any>
  comments?: TermSheetComment[]
  onLoadComments?: (termSheetId: string) => void
  onAddComment?: (termSheetId: string, clauseKey: string, body: string) => Promise<any>
  onResolveComment?: (commentId: string) => Promise<boolean>
  fairnessScores?: Record<string, { score: number; label: string; tip: string }>
  versions?: TermSheetVersion[]
  onLoadVersions?: (termSheetId: string) => void
  onRestoreVersion?: (termSheetId: string, version: TermSheetVersion) => Promise<boolean>
  onAnalyze?: (termSheetId: string, clauseKey: string) => Promise<string | null>
  onEncrypt?: (sheetId: string, termsJson: string) => Promise<boolean>
  onDecrypt?: (sheetId: string) => Promise<string | null>
  signatures?: SignatureRequest[]
  onLoadSignatures?: (termSheetId: string) => void
  onRequestSignature?: (termSheetId: string, signerId: string) => Promise<any>
  onSign?: (signatureRequestId: string) => Promise<any>
  onDeclineSignature?: (signatureRequestId: string, reason?: string) => Promise<any>
  currentUserId?: string
}

type ViewTab = 'editor' | 'history' | 'signatures'

const STATUS_OPTIONS = [
  { value: 'draft' as const, label: 'Draft' },
  { value: 'negotiating' as const, label: 'Negotiating' },
  { value: 'final' as const, label: 'Final' },
  { value: 'signed' as const, label: 'Signed' },
  { value: 'archived' as const, label: 'Archived' },
]

export function TermSheetDrawer({
  sheet,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  onGeneratePDF,
  onCreateTemplate,
  comments,
  onLoadComments,
  onAddComment,
  onResolveComment,
  fairnessScores,
  versions,
  onLoadVersions,
  onRestoreVersion,
  onAnalyze,
  onEncrypt,
  onDecrypt,
  signatures,
  onLoadSignatures,
  onRequestSignature,
  onSign,
  onDeclineSignature,
  currentUserId,
}: Props) {
  const [editName, setEditName] = useState('')
  const [editTerms, setEditTerms] = useState<Record<string, string>>({})
  const [editStatus, setEditStatus] = useState<'draft' | 'negotiating' | 'final' | 'signed' | 'archived'>('draft')
  const [saving, setSaving] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [viewTab, setViewTab] = useState<ViewTab>('editor')
  const [encrypting, setEncrypting] = useState(false)
  const [signingId, setSigningId] = useState<string | null>(null)

  useEffect(() => {
    if (sheet && open) {
      setEditName(sheet.name)
      setEditTerms(sheet.terms ?? {})
      setEditStatus(sheet.status)
      setDirty(false)
      setViewTab('editor')
      if (onLoadComments) onLoadComments(sheet.id)
      if (onLoadVersions) onLoadVersions(sheet.id)
      if (onLoadSignatures) onLoadSignatures(sheet.id)
    }
  }, [sheet?.id, open])

  const handleTermsChange = (terms: Record<string, string>) => {
    setEditTerms(terms)
    setDirty(true)
  }

  const handleSave = async () => {
    if (!sheet) return
    setSaving(true)
    const ok = await onUpdate(sheet.id, {
      name: editName,
      terms: editTerms,
      status: editStatus,
    })
    setSaving(false)
    if (ok) {
      toast.success('Term sheet saved')
      setDirty(false)
    } else {
      toast.error('Failed to save')
    }
  }

  const handleExportPDF = async () => {
    if (!sheet) return
    if (dirty) await handleSave()
    setGeneratingPDF(true)
    const url = await onGeneratePDF(sheet.id)
    setGeneratingPDF(false)
    if (url) {
      window.open(url, '_blank')
      toast.success('PDF generated')
    } else {
      toast.error('PDF generation failed')
    }
  }

  const handleEncrypt = async () => {
    if (!sheet || !onEncrypt) return
    if (dirty) await handleSave()
    setEncrypting(true)
    const ok = await onEncrypt(sheet.id, JSON.stringify(editTerms))
    setEncrypting(false)
    if (ok) toast.success('Terms encrypted with Vault')
    else toast.error('Encryption failed')
  }

  const handleDelete = async () => {
    if (!sheet) return
    if (!confirm(`Delete "${sheet.name}"? This cannot be undone.`)) return
    const ok = await onDelete(sheet.id)
    if (ok) {
      toast.success('Term sheet deleted')
      onOpenChange(false)
    } else {
      toast.error('Failed to delete')
    }
  }

  if (!sheet) return null

  return (
    <>
      <Modal
        open={open}
        onClose={() => onOpenChange(false)}
        title={sheet.name}
        subtitle={sheet.startup?.company_name ?? undefined}
        size="xl"
        footer={
          <div className="flex items-center gap-2 w-full flex-wrap">
            <button
              onClick={handleDelete}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center cursor-pointer transition-all hover:opacity-70"
              style={{ background: 'var(--neg-bg)' }}
            >
              <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--neg)' }} />
            </button>
            <button
              onClick={() => setTemplateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97]"
              style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Template</span>
            </button>
            {onEncrypt && (
              <button
                onClick={handleEncrypt}
                disabled={encrypting}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97] disabled:opacity-50"
                style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
              >
                {encrypting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Encrypt</span>
              </button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                disabled={generatingPDF}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97] disabled:opacity-50"
                style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
              >
                {generatingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                onClick={handleSave}
                disabled={!dirty || saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all active:scale-[0.97] disabled:opacity-50"
                style={{ background: dirty ? 'var(--blue)' : 'var(--surface-3)', color: dirty ? '#fff' : 'var(--muted-2)' }}
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          {/* Header info card */}
          <div
            className="flex items-center gap-3 p-3.5 rounded-[12px]"
            style={{ background: 'var(--surface-2)' }}
          >
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
              style={{ background: 'var(--blue-bg)' }}
            >
              <FileText className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={editName}
                onChange={e => { setEditName(e.target.value); setDirty(true) }}
                className="w-full text-[14px] font-semibold bg-transparent border-none focus:outline-none"
                style={{ color: 'var(--ink)' }}
              />
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--surface-3)', color: 'var(--muted)' }}
                >
                  {ROUND_TYPES.find(r => r.value === sheet.round_type)?.label ?? sheet.round_type}
                </span>
                {sheet.ai_generated && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold" style={{ color: 'var(--blue)' }}>
                    <Sparkles className="w-3 h-3" /> AI
                  </span>
                )}
                {fairnessScores && Object.keys(fairnessScores).length > 0 && (() => {
                  const vals = Object.values(fairnessScores)
                  const avg = Math.round(vals.reduce((s, v) => s + v.score, 0) / vals.length)
                  const label = avg >= 7 ? 'Fair Deal' : avg >= 4 ? 'Review' : 'Aggressive'
                  const color = avg >= 7 ? 'var(--pos)' : avg >= 4 ? 'var(--warn)' : 'var(--neg)'
                  const bg = avg >= 7 ? 'var(--pos-bg)' : avg >= 4 ? 'var(--warn-bg)' : 'var(--neg-bg)'
                  return (
                    <span
                      className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: bg, color }}
                    >
                      <Shield className="w-3 h-3" /> {label} ({avg}/10)
                    </span>
                  )
                })()}
                {sheet.investor?.full_name && (
                  <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                    {sheet.investor.full_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status selector */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-2)' }}>
              Status
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map(opt => {
                const active = editStatus === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => { setEditStatus(opt.value); setDirty(true) }}
                    className="px-3 py-1.5 rounded-[8px] text-[11px] font-semibold cursor-pointer transition-all active:scale-[0.97]"
                    style={{
                      background: active ? 'var(--blue)' : 'var(--surface-2)',
                      color: active ? '#fff' : 'var(--muted)',
                      border: `1px solid ${active ? 'var(--blue)' : 'var(--line)'}`,
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* View tabs */}
          <div
            className="inline-flex items-center gap-1 p-1 rounded-[10px] self-start"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
          >
            {([
              { value: 'editor' as ViewTab, label: 'Editor' },
              ...(onLoadVersions ? [{ value: 'history' as ViewTab, label: `History${versions && versions.length > 0 ? ` (${versions.length})` : ''}` }] : []),
              ...(onLoadSignatures ? [{ value: 'signatures' as ViewTab, label: `Signatures${signatures && signatures.length > 0 ? ` (${signatures.length})` : ''}` }] : []),
            ]).map(opt => {
              const active = viewTab === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setViewTab(opt.value)}
                  className="px-3 py-1.5 rounded-[8px] text-[11px] font-semibold cursor-pointer transition-all"
                  style={{
                    background: active ? 'var(--blue)' : 'transparent',
                    color: active ? '#fff' : 'var(--muted)',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          {viewTab === 'editor' ? (
            <TermSheetEditor
              roundType={sheet.round_type}
              terms={editTerms}
              onChange={handleTermsChange}
              comments={comments}
              onAddComment={onAddComment ? (clauseKey, body) => onAddComment(sheet.id, clauseKey, body) : undefined}
              onResolveComment={onResolveComment}
              fairnessScores={fairnessScores}
              onAnalyze={onAnalyze ? (clauseKey) => onAnalyze(sheet.id, clauseKey) : undefined}
            />
          ) : viewTab === 'history' ? (
            <VersionHistory
              versions={versions ?? []}
              currentTerms={editTerms}
              termSheetId={sheet.id}
              onRestore={onRestoreVersion!}
            />
          ) : viewTab === 'signatures' ? (
            <div className="flex flex-col gap-4">
              {/* Signature status */}
              <div
                className="flex items-center gap-2 p-3 rounded-[12px]"
                style={{ background: 'var(--surface-2)' }}
              >
                <PenTool className="w-4 h-4" style={{ color: 'var(--blue)' }} />
                <span className="text-[12px] font-semibold" style={{ color: 'var(--ink)' }}>
                  {sheet.signature_status === 'fully_signed' ? 'Fully Signed' :
                   sheet.signature_status === 'partially_signed' ? 'Partially Signed' :
                   sheet.signature_status === 'pending' ? 'Awaiting Signatures' :
                   'No Signatures'}
                </span>
              </div>

              {/* Request signature */}
              {onRequestSignature && sheet.investor_id && (sheet.status === 'final' || sheet.status === 'negotiating') && (
                <Button
                  variant="primary"
                  size="sm"
                  iconLeft={PenTool}
                  onClick={async () => {
                    const result = await onRequestSignature(sheet.id, sheet.investor_id!)
                    if (result) {
                      toast.success('Signature request sent')
                      if (onLoadSignatures) onLoadSignatures(sheet.id)
                    }
                  }}
                >
                  Request Investor Signature
                </Button>
              )}

              {/* Signature list */}
              {(!signatures || signatures.length === 0) ? (
                <div className="text-center py-6">
                  <PenTool className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--muted-2)' }} />
                  <p className="text-[12px]" style={{ color: 'var(--muted-2)' }}>No signature requests yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {signatures.map(sig => (
                    <div
                      key={sig.id}
                      className="flex items-center gap-3 p-3 rounded-[12px]"
                      style={{ background: 'var(--surface-2)' }}
                    >
                      {sig.status === 'signed' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--pos)' }} />
                      ) : sig.status === 'declined' ? (
                        <XCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--neg)' }} />
                      ) : (
                        <Clock className="w-4 h-4 shrink-0" style={{ color: 'var(--warn)' }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
                          {sig.signer_name ?? sig.signer_email}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>
                          {sig.status === 'signed' && sig.signed_at
                            ? `Signed ${new Date(sig.signed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                            : sig.status === 'declined'
                            ? 'Declined'
                            : sig.status === 'expired'
                            ? 'Expired'
                            : `Pending · ${sig.provider === 'aadhaar_esign' ? 'Aadhaar eSign' : 'Manual'}`
                          }
                        </p>
                      </div>
                      {currentUserId === sig.signer_id && sig.status !== 'signed' && sig.status !== 'declined' && sig.status !== 'expired' && (
                        <div className="flex items-center gap-1.5">
                          {onSign && (
                            <button
                              onClick={async () => {
                                setSigningId(sig.id)
                                const result = await onSign(sig.id)
                                setSigningId(null)
                                if (result) {
                                  toast.success('Signed successfully')
                                  if (onLoadSignatures) onLoadSignatures(sheet.id)
                                }
                              }}
                              disabled={signingId === sig.id}
                              className="px-3 py-1.5 rounded-[8px] text-[11px] font-semibold cursor-pointer transition-all active:scale-[0.97] disabled:opacity-50"
                              style={{ background: 'var(--blue)', color: '#fff' }}
                            >
                              {signingId === sig.id ? 'Signing…' : 'Sign'}
                            </button>
                          )}
                          {onDeclineSignature && (
                            <button
                              onClick={async () => {
                                const reason = prompt('Reason for declining (optional):')
                                await onDeclineSignature(sig.id, reason ?? undefined)
                                if (onLoadSignatures) onLoadSignatures(sheet.id)
                              }}
                              className="px-3 py-1.5 rounded-[8px] text-[11px] font-semibold cursor-pointer transition-all"
                              style={{ color: 'var(--neg)', background: 'var(--neg-bg)' }}
                            >
                              Decline
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </Modal>

      <CreateTemplateModal
        open={templateOpen}
        onClose={() => setTemplateOpen(false)}
        onCreate={onCreateTemplate}
        initialTerms={editTerms}
        initialRoundType={sheet.round_type}
      />
    </>
  )
}
