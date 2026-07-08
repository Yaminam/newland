import { useCallback, useMemo, useState } from 'react'

export function useRowSelection<T extends { id: string }>(rows: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Drop any IDs that disappeared from the current row list so selections don't
  // stick after filters/search change the data.
  const validSelectedIds = useMemo(() => {
    const ids = new Set(rows.map(r => r.id))
    return new Set([...selectedIds].filter(id => ids.has(id)))
  }, [rows, selectedIds])

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedIds(prev => {
      const ids = new Set(rows.map(r => r.id))
      const allSelected = rows.length > 0 && [...ids].every(id => prev.has(id))
      return allSelected ? new Set() : ids
    })
  }, [rows])

  const clear = useCallback(() => setSelectedIds(new Set()), [])

  const isSelected = useCallback((id: string) => validSelectedIds.has(id), [validSelectedIds])

  const allSelected = rows.length > 0 && rows.every(r => validSelectedIds.has(r.id))
  const someSelected = validSelectedIds.size > 0 && !allSelected

  const selectedRows = useMemo(
    () => rows.filter(r => validSelectedIds.has(r.id)),
    [rows, validSelectedIds],
  )

  return {
    selectedIds: [...validSelectedIds],
    selectedRows,
    count: validSelectedIds.size,
    isSelected,
    toggle,
    toggleAll,
    clear,
    allSelected,
    someSelected,
  }
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

function csvEscape(v: unknown): string {
  if (v == null) return ''
  const s = typeof v === 'string' ? v : JSON.stringify(v)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function downloadCSV<T>(
  rows: T[],
  columns: Array<{ header: string; accessor: (row: T) => unknown }>,
  filename: string,
): void {
  if (rows.length === 0) return
  const lines: string[] = []
  lines.push(columns.map(c => csvEscape(c.header)).join(','))
  for (const r of rows) {
    lines.push(columns.map(c => csvEscape(c.accessor(r))).join(','))
  }
  // UTF-8 BOM so Excel opens it cleanly with non-ASCII characters.
  const blob = new Blob(['﻿', lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function timestampedFilename(prefix: string, ext = 'csv'): string {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
  return `${prefix}-${stamp}.${ext}`
}
