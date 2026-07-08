import { useState } from 'react'
import {
  FileText, Download, Trash2, Eye, ChevronDown, ChevronRight,
  BarChart3, Table, Scale, File, Lock, Unlock, MoreHorizontal,
} from 'lucide-react'
import { DOCUMENT_CATEGORIES, type DealRoomDocument, type DocumentCategory } from '@/app/hooks/useDealRooms'

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  pitch_deck: FileText,
  financials: BarChart3,
  cap_table: Table,
  legal: Scale,
  other: File,
}

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  pitch_deck: { color: 'var(--blue)', bg: 'var(--blue-bg)' },
  financials: { color: 'var(--pos)', bg: 'var(--pos-bg)' },
  cap_table: { color: 'var(--violet, #7C3AED)', bg: 'var(--violet-bg, #F3E8FF)' },
  legal: { color: 'var(--amber, #D97706)', bg: 'var(--amber-bg, #FFFBEB)' },
  other: { color: 'var(--muted)', bg: 'var(--surface-2)' },
}

const FILE_EXT_COLORS: Record<string, string> = {
  pdf: '#EF4444',
  doc: '#3B82F6',
  docx: '#3B82F6',
  xls: '#059669',
  xlsx: '#059669',
  csv: '#059669',
  png: '#D97706',
  jpg: '#D97706',
  jpeg: '#D97706',
}

interface Props {
  documents: DealRoomDocument[]
  isOwner: boolean
  onView: (doc: DealRoomDocument) => void
  onDownload: (doc: DealRoomDocument) => void
  onDelete: (doc: DealRoomDocument) => void
  onEncrypt?: (doc: DealRoomDocument) => void
  onDecrypt?: (doc: DealRoomDocument) => void
}

export function DocumentList({ documents, isOwner, onView, onDownload, onDelete, onEncrypt, onDecrypt }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const grouped = DOCUMENT_CATEGORIES.reduce((acc, cat) => {
    acc[cat.key] = documents.filter(d => d.category === cat.key)
    return acc
  }, {} as Record<DocumentCategory, DealRoomDocument[]>)

  const nonEmptyCategories = DOCUMENT_CATEGORIES.filter(c => grouped[c.key].length > 0)

  if (documents.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 gap-3 rounded-[var(--r-lg)]"
        style={{ background: 'var(--bg-soft)', border: '1px dashed var(--line)' }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'var(--surface-2)' }}
        >
          <FileText className="w-6 h-6" style={{ color: 'var(--muted-2)' }} />
        </div>
        <div className="text-center">
          <p className="text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>No documents yet</p>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--muted-2)' }}>
            Upload documents to share with deal room members
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {nonEmptyCategories.map(cat => {
        const docs = grouped[cat.key]
        const isCollapsed = collapsed[cat.key]
        const Icon = CATEGORY_ICONS[cat.key] ?? File
        const colors = CATEGORY_COLORS[cat.key] ?? CATEGORY_COLORS.other

        return (
          <div key={cat.key}>
            {/* Category header */}
            <button
              onClick={() => setCollapsed(p => ({ ...p, [cat.key]: !p[cat.key] }))}
              className="flex items-center gap-2.5 w-full text-left py-1 cursor-pointer group"
            >
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: colors.bg }}
              >
                <Icon className="w-3 h-3" style={{ color: colors.color }} />
              </div>
              <span className="text-[12px] font-bold uppercase tracking-wider flex-1" style={{ color: 'var(--muted-2)' }}>
                {cat.label}
              </span>
              <span
                className="text-[11px] font-semibold w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: colors.bg, color: colors.color }}
              >
                {docs.length}
              </span>
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--muted-2)' }} />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--muted-2)' }} />
              )}
            </button>

            {/* Document cards */}
            {!isCollapsed && (
              <div className="mt-2 flex flex-col gap-1.5">
                {docs.map(doc => {
                  const ext = doc.file_name.split('.').pop()?.toLowerCase() ?? ''
                  const extColor = FILE_EXT_COLORS[ext] ?? 'var(--muted)'
                  const isMenuVisible = menuOpen === doc.id

                  return (
                    <div
                      key={doc.id}
                      className="relative flex items-center gap-3 py-2.5 px-3 rounded-[var(--r-md)] transition-all group cursor-pointer"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--line)',
                      }}
                      onClick={() => onView(doc)}
                      onMouseEnter={() => {}}
                      onMouseLeave={() => setMenuOpen(null)}
                    >
                      {/* File type badge */}
                      <div
                        className="w-9 h-10 rounded-md flex flex-col items-center justify-center shrink-0 relative"
                        style={{ background: `${extColor}10`, border: `1px solid ${extColor}25` }}
                      >
                        <File className="w-4 h-4" style={{ color: extColor }} />
                        <span
                          className="text-[7px] font-black uppercase mt-0.5 leading-none tracking-wider"
                          style={{ color: extColor }}
                        >
                          {ext}
                        </span>
                      </div>

                      {/* File info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate leading-tight" style={{ color: 'var(--ink)' }}>
                          {doc.file_name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[11px]" style={{ color: 'var(--muted-2)' }}>
                            {doc.uploader?.full_name ?? 'Unknown'}
                          </span>
                          <span className="text-[11px]" style={{ color: 'var(--line)' }}>&middot;</span>
                          <span className="text-[11px]" style={{ color: 'var(--muted-2)' }}>
                            {new Date(doc.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                          {doc.file_size && (
                            <>
                              <span className="text-[11px]" style={{ color: 'var(--line)' }}>&middot;</span>
                              <span className="text-[11px]" style={{ color: 'var(--muted-2)' }}>
                                {formatFileSize(doc.file_size)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Encrypted badge */}
                      {doc.is_encrypted && (
                        <span
                          className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full shrink-0"
                          style={{ background: 'var(--pos-bg)', color: 'var(--pos)' }}
                        >
                          <Lock className="w-2.5 h-2.5" />
                          Encrypted
                        </span>
                      )}

                      {/* Action buttons — visible on hover */}
                      <div
                        className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onView(doc)}
                          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--blue-bg)] cursor-pointer"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" style={{ color: 'var(--blue)' }} />
                        </button>
                        <button
                          onClick={() => onDownload(doc)}
                          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--pos-bg)] cursor-pointer"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" style={{ color: 'var(--pos)' }} />
                        </button>
                        {isOwner && (
                          <div className="relative">
                            <button
                              onClick={() => setMenuOpen(isMenuVisible ? null : doc.id)}
                              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-[var(--surface-2)] cursor-pointer"
                              title="More actions"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                            </button>
                            {isMenuVisible && (
                              <div
                                className="absolute right-0 top-8 z-20 w-40 rounded-[var(--r-md)] py-1 shadow-lg"
                                style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}
                              >
                                {onEncrypt && !doc.is_encrypted && (
                                  <button
                                    onClick={() => { setMenuOpen(null); onEncrypt(doc) }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-[12px] font-medium transition-colors hover:bg-[var(--bg-soft)] cursor-pointer"
                                    style={{ color: 'var(--ink)' }}
                                  >
                                    <Lock className="w-3.5 h-3.5" style={{ color: 'var(--pos)' }} />
                                    Encrypt Notes
                                  </button>
                                )}
                                {onDecrypt && doc.is_encrypted && (
                                  <button
                                    onClick={() => { setMenuOpen(null); onDecrypt(doc) }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-[12px] font-medium transition-colors hover:bg-[var(--bg-soft)] cursor-pointer"
                                    style={{ color: 'var(--ink)' }}
                                  >
                                    <Unlock className="w-3.5 h-3.5" style={{ color: 'var(--amber, #D97706)' }} />
                                    Decrypt Notes
                                  </button>
                                )}
                                <button
                                  onClick={() => { setMenuOpen(null); onDelete(doc) }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-left text-[12px] font-medium transition-colors hover:bg-[var(--bg-soft)] cursor-pointer"
                                  style={{ color: 'var(--neg)' }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
