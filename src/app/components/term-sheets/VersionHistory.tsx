import { useState } from 'react'
import { History, RotateCcw, Eye, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import type { TermSheetVersion } from '@/app/hooks/useTermSheets'

interface Props {
  versions: TermSheetVersion[]
  currentTerms: Record<string, string>
  termSheetId: string
  onRestore: (termSheetId: string, version: TermSheetVersion) => Promise<boolean>
}

export function VersionHistory({ versions, currentTerms, termSheetId, onRestore }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)

  if (versions.length === 0) {
    return (
      <div className="py-8 text-center">
        <History className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--muted-2)' }} />
        <p className="text-[13px]" style={{ color: 'var(--muted-2)' }}>No version history yet</p>
        <p className="text-[11px] mt-1" style={{ color: 'var(--muted-2)' }}>
          Versions are saved automatically when you edit and save the term sheet.
        </p>
      </div>
    )
  }

  const handleRestore = async (version: TermSheetVersion) => {
    if (!confirm(`Restore version ${version.version_number}? Current terms will be saved as a new version.`)) return
    setRestoring(true)
    const ok = await onRestore(termSheetId, version)
    setRestoring(false)
    if (ok) toast.success(`Restored version ${version.version_number}`)
    else toast.error('Failed to restore')
  }

  // Compute diff between a version and current terms
  const getDiff = (versionTerms: Record<string, string>) => {
    const allKeys = new Set([...Object.keys(versionTerms), ...Object.keys(currentTerms)])
    const changes: { key: string; old: string; new: string }[] = []
    for (const key of allKeys) {
      const oldVal = versionTerms[key] ?? ''
      const newVal = currentTerms[key] ?? ''
      if (oldVal !== newVal) {
        changes.push({ key, old: oldVal, new: newVal })
      }
    }
    return changes
  }

  return (
    <div className="flex flex-col gap-2">
      {versions.map(v => {
        const isExpanded = expandedId === v.id
        const diff = isExpanded ? getDiff(v.terms as Record<string, string>) : []

        return (
          <div
            key={v.id}
            className="rounded-[var(--r-md)] overflow-hidden"
            style={{ border: '1px solid var(--line)' }}
          >
            {/* Version header */}
            <div
              className="flex items-center gap-3 p-3 cursor-pointer"
              style={{ background: 'var(--surface-2)' }}
              onClick={() => setExpandedId(isExpanded ? null : v.id)}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'var(--blue-bg)' }}
              >
                <span className="text-[11px] font-bold" style={{ color: 'var(--blue)' }}>
                  v{v.version_number}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium" style={{ color: 'var(--ink)' }}>
                  {v.name}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--muted-2)' }}>
                  {new Date(v.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                  {' · '}
                  <span
                    className="font-semibold px-1 py-0.5 rounded"
                    style={{
                      background: v.status === 'final' ? 'var(--pos-bg)' : v.status === 'archived' ? 'var(--bg-soft)' : 'var(--blue-bg)',
                      color: v.status === 'final' ? 'var(--pos)' : v.status === 'archived' ? 'var(--muted)' : 'var(--blue)',
                    }}
                  >
                    {v.status}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={e => { e.stopPropagation(); handleRestore(v) }}
                  disabled={restoring}
                  className="p-1.5 rounded-[var(--r-sm)] transition-colors hover:bg-[var(--surface)] cursor-pointer"
                  title="Restore this version"
                  style={{ color: 'var(--blue)' }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" style={{ color: 'var(--muted-2)' }} />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--muted-2)' }} />
                )}
              </div>
            </div>

            {/* Expanded diff view */}
            {isExpanded && (
              <div className="p-3 border-t" style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}>
                {diff.length === 0 ? (
                  <p className="text-[11px]" style={{ color: 'var(--muted-2)' }}>
                    No differences from current version.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted-2)' }}>
                      {diff.length} field{diff.length > 1 ? 's' : ''} changed vs current
                    </p>
                    {diff.map(d => (
                      <div key={d.key} className="text-[11px]">
                        <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                          {d.key.replace(/_/g, ' ')}
                        </span>
                        <div className="flex flex-col gap-0.5 mt-0.5 pl-2" style={{ borderLeft: '2px solid var(--line)' }}>
                          {d.old && (
                            <span style={{ color: 'var(--neg)' }}>
                              - {d.old}
                            </span>
                          )}
                          {d.new && (
                            <span style={{ color: 'var(--pos)' }}>
                              + {d.new}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
