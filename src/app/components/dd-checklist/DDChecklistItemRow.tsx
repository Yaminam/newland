import { useState, useRef } from 'react'
import {
  ChevronDown, ChevronUp, FileText, Calendar, Upload, Loader2, ExternalLink,
  CheckCircle, Circle, Clock, AlertTriangle, Flag, RotateCcw, Trash2, Check,
} from 'lucide-react'
import { DD_CATEGORIES, DD_ITEM_STATUSES, type DDChecklistItem, type DDItemStatus } from '@/app/hooks/useDDChecklists'

interface Props {
  item: DDChecklistItem
  onRemove?: (id: string) => void
  onUploadDoc?: (itemId: string, file: File) => Promise<string | null>
  onViewDoc?: (documentPath: string) => Promise<string | null>
  // investor actions
  onVerify?: (itemId: string) => Promise<boolean>
  onRequestReupload?: (itemId: string, comment: string) => Promise<boolean>
  onFlag?: (itemId: string, comment?: string) => Promise<boolean>
  viewMode?: 'investor' | 'founder'
}

const STATUS_ICONS: Partial<Record<DDItemStatus, typeof Circle>> = {
  not_started: Circle,
  in_progress: Clock,
  uploaded: FileText,
  verified: CheckCircle,
  flagged: Flag,
}

function StatusBadge({ status }: { status: DDItemStatus }) {
  const info = DD_ITEM_STATUSES.find(s => s.value === status)
  if (!info) return null
  return (
    <span
      className="shrink-0 inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full"
      style={{
        background: `color-mix(in srgb, ${info.color} 14%, transparent)`,
        color: info.color,
        border: `1px solid color-mix(in srgb, ${info.color} 28%, transparent)`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: info.color }} />
      {info.label}
    </span>
  )
}

export function DDChecklistItemRow({
  item,
  onRemove,
  onUploadDoc,
  onViewDoc,
  onVerify,
  onRequestReupload,
  onFlag,
  viewMode = 'investor',
}: Props) {
  const isFounder = viewMode === 'founder'
  const [expanded, setExpanded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // investor action state
  const [investorAction, setInvestorAction] = useState<'reupload' | 'flag' | null>(null)
  const [actionComment, setActionComment] = useState('')
  const [actioning, setActioning] = useState(false)

  const status = item.status ?? 'in_progress'
  const isVerified = status === 'verified'
  const isFlagged = status === 'flagged'
  const isUploaded = status === 'uploaded'
  const hasDoc = !!item.document_id
  const hasNote = !!(item.notes?.trim())

  const cat = DD_CATEGORIES.find(c => c.value === item.category)
  const isOverdue = item.due_date && !isVerified && new Date(item.due_date) < new Date()
  const StatusIcon = STATUS_ICONS[status] ?? Circle

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onUploadDoc) return
    setUploading(true)
    await onUploadDoc(item.id, file)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleViewDoc = async () => {
    if (!item.document_id || !onViewDoc) return
    const url = await onViewDoc(item.document_id)
    if (url) window.open(url, '_blank')
  }

  const handleVerify = async () => {
    if (!onVerify) return
    setActioning(true)
    await onVerify(item.id)
    setActioning(false)
  }

  const handleSendAction = async () => {
    if (investorAction === 'reupload') {
      if (!onRequestReupload || !actionComment.trim()) return
      setActioning(true)
      await onRequestReupload(item.id, actionComment.trim())
      setActioning(false)
    } else if (investorAction === 'flag') {
      if (!onFlag) return
      setActioning(true)
      await onFlag(item.id, actionComment.trim() || undefined)
      setActioning(false)
    }
    setInvestorAction(null)
    setActionComment('')
  }

  const cancelAction = () => {
    setInvestorAction(null)
    setActionComment('')
  }

  return (
    <div
      className="transition-colors"
      style={{
        borderBottom: '1px solid var(--line-2)',
        background: expanded ? 'var(--surface-2)' : 'transparent',
      }}
    >
      {/* ── Row header ── */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <StatusIcon
          className="w-5 h-5 shrink-0"
          style={{
            color: isVerified ? 'var(--pos)' : isFlagged ? 'var(--neg)' : isUploaded ? 'var(--warn)' : 'var(--blue)',
          }}
        />

        <div className="flex-1 min-w-0">
          <p
            className="text-[13px] font-semibold"
            style={{
              color: isVerified ? 'var(--muted)' : 'var(--ink)',
              textDecoration: isVerified ? 'line-through' : 'none',
              letterSpacing: '-0.01em',
            }}
          >
            {item.title}
          </p>
          {item.description && (
            <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--muted-2)' }}>
              {item.description}
            </p>
          )}
        </div>

        <StatusBadge status={status} />

        {/* Category */}
        <span
          className="shrink-0 inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full"
          style={{
            background: `color-mix(in srgb, ${cat?.color ?? 'var(--muted)'} 12%, transparent)`,
            color: cat?.color ?? 'var(--muted)',
            border: `1px solid color-mix(in srgb, ${cat?.color ?? 'var(--muted)'} 25%, transparent)`,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cat?.color ?? 'var(--muted)' }} />
          {cat?.label ?? item.category}
        </span>

        {item.due_date && (
          <span
            className="shrink-0 text-[10px] font-medium inline-flex items-center gap-1"
            style={{ color: isOverdue ? 'var(--neg)' : 'var(--muted-2)' }}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            {new Date(item.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        )}

        {hasDoc && (
          <div className="w-6 h-6 rounded-[6px] flex items-center justify-center shrink-0" style={{ background: 'var(--blue-bg)' }}>
            <FileText className="w-3 h-3" style={{ color: 'var(--blue)' }} />
          </div>
        )}

        <button
          onClick={() => setExpanded(v => !v)}
          className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 cursor-pointer transition-colors hover:bg-[var(--surface-3)]"
          style={{ color: 'var(--muted-2)' }}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Delete only for founder if not yet verified */}
        {isFounder && !isVerified && onRemove && (
          <button
            onClick={() => onRemove(item.id)}
            className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 cursor-pointer transition-colors opacity-0 group-hover:opacity-100 hover:bg-[var(--neg-bg)]"
            style={{ color: 'var(--neg)' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Expanded content ── */}
      {expanded && (
        <div className="px-4 pb-4 pl-12 space-y-3">

          {isFounder ? (
            /* ─── FOUNDER expanded ─── */
            <>
              {/* Investor feedback banner (re-upload request or flag) */}
              {hasNote && (status === 'in_progress' || isFlagged) && (
                <div
                  className="flex items-start gap-2.5 p-3 rounded-[10px]"
                  style={{
                    background: isFlagged ? 'var(--neg-bg, #FEF2F2)' : 'var(--warn-bg, #FFFBEB)',
                    border: `1px solid ${isFlagged ? 'color-mix(in srgb, var(--neg) 25%, transparent)' : 'color-mix(in srgb, var(--warn) 25%, transparent)'}`,
                  }}
                >
                  {isFlagged
                    ? <Flag className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'var(--neg)' }} />
                    : <RotateCcw className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'var(--warn)' }} />
                  }
                  <div>
                    <p className="text-[11px] font-bold mb-0.5" style={{ color: isFlagged ? 'var(--neg)' : 'var(--warn)' }}>
                      {isFlagged ? 'Flagged by investor' : 'Re-upload requested'}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--ink)' }}>{item.notes}</p>
                  </div>
                </div>
              )}

              {/* Document area */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* View document button */}
                {hasDoc && (
                  <button
                    onClick={handleViewDoc}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[11px] font-semibold cursor-pointer transition-colors hover:opacity-90"
                    style={{ background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid rgba(37,99,235,0.15)' }}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View document
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}

                {/* Upload / Change upload button (hidden once verified) */}
                {!isVerified && onUploadDoc && (
                  <label
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[11px] font-semibold cursor-pointer transition-colors hover:bg-[var(--surface-3)]"
                    style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--line)' }}
                  >
                    <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} disabled={uploading} />
                    {uploading ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
                    ) : hasDoc ? (
                      <><RotateCcw className="w-3.5 h-3.5" /> Change upload</>
                    ) : (
                      <><Upload className="w-3.5 h-3.5" /> Upload document</>
                    )}
                  </label>
                )}

                {/* Verified lock state */}
                {isVerified && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[11px] font-semibold"
                    style={{ background: 'var(--pos-bg, #F0FDF4)', color: 'var(--pos)', border: '1px solid color-mix(in srgb, var(--pos) 25%, transparent)' }}
                  >
                    <Check className="w-3.5 h-3.5" /> Verified by investor
                  </span>
                )}

                {/* Status hint for non-verified uploaded state */}
                {isUploaded && !isVerified && (
                  <span className="text-[11px]" style={{ color: 'var(--muted)' }}>Awaiting investor review</span>
                )}
              </div>
            </>
          ) : (
            /* ─── INVESTOR expanded ─── */
            <>
              {/* Document view */}
              {hasDoc && (
                <button
                  onClick={handleViewDoc}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[11px] font-semibold cursor-pointer transition-colors hover:opacity-90"
                  style={{ background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid rgba(37,99,235,0.15)' }}
                >
                  <FileText className="w-3.5 h-3.5" />
                  View & Download
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}

              {/* Actions based on status */}
              {isUploaded && !isVerified && (
                <>
                  {investorAction === null ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Verify */}
                      {onVerify && (
                        <button
                          onClick={handleVerify}
                          disabled={actioning}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[11px] font-semibold cursor-pointer transition-all active:scale-[0.97] disabled:opacity-60"
                          style={{ background: 'var(--pos-bg, #F0FDF4)', color: 'var(--pos)', border: '1px solid color-mix(in srgb, var(--pos) 25%, transparent)' }}
                        >
                          {actioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Verify
                        </button>
                      )}

                      {/* Request Re-upload */}
                      {onRequestReupload && (
                        <button
                          onClick={() => setInvestorAction('reupload')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[11px] font-semibold cursor-pointer transition-all active:scale-[0.97]"
                          style={{ background: 'var(--warn-bg, #FFFBEB)', color: 'var(--warn)', border: '1px solid color-mix(in srgb, var(--warn) 25%, transparent)' }}
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Request Re-upload
                        </button>
                      )}

                      {/* Flag */}
                      {onFlag && (
                        <button
                          onClick={() => setInvestorAction('flag')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[11px] font-semibold cursor-pointer transition-all active:scale-[0.97]"
                          style={{ background: 'var(--neg-bg, #FEF2F2)', color: 'var(--neg)', border: '1px solid color-mix(in srgb, var(--neg) 25%, transparent)' }}
                        >
                          <Flag className="w-3.5 h-3.5" /> Flag
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Inline comment form */
                    <div className="flex flex-col gap-2">
                      <p className="text-[11px] font-semibold" style={{ color: 'var(--ink)' }}>
                        {investorAction === 'reupload'
                          ? 'Explain what needs to be changed or re-submitted:'
                          : 'Add a note explaining why this is flagged (optional):'}
                      </p>
                      <textarea
                        autoFocus
                        value={actionComment}
                        onChange={e => setActionComment(e.target.value)}
                        placeholder={
                          investorAction === 'reupload'
                            ? 'E.g. Please provide the audited version, signed by a CA…'
                            : 'E.g. Document appears incomplete or unrelated…'
                        }
                        rows={3}
                        className="fc-input w-full text-[12px] resize-none"
                        style={{ background: 'var(--surface)', minHeight: 70 }}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={cancelAction}
                          className="text-[11px] font-semibold px-3 py-1.5 rounded-[8px] cursor-pointer transition-colors hover:bg-[var(--surface-3)]"
                          style={{ color: 'var(--muted)' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSendAction}
                          disabled={actioning || (investorAction === 'reupload' && !actionComment.trim())}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold cursor-pointer transition-all active:scale-[0.97] disabled:opacity-50"
                          style={{
                            background: investorAction === 'flag' ? 'var(--neg)' : 'var(--warn)',
                            color: '#fff',
                          }}
                        >
                          {actioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          {investorAction === 'flag' ? 'Flag Item' : 'Send Request'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Verified state */}
              {isVerified && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-[11px] font-semibold"
                  style={{ background: 'var(--pos-bg, #F0FDF4)', color: 'var(--pos)', border: '1px solid color-mix(in srgb, var(--pos) 25%, transparent)' }}
                >
                  <Check className="w-3.5 h-3.5" /> Verified
                </span>
              )}

              {/* Waiting state */}
              {!isUploaded && !isVerified && (
                <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  {isFlagged
                    ? (hasNote ? `Flagged — "${item.notes}"` : 'Flagged')
                    : 'Waiting for founder to upload document'}
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
