'use client'

import React, { useMemo, useState } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { cn } from '@/app/lib/utils'

interface Column {
  key: string
  header: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
  width?: string
}

interface DataTableProps {
  columns: Column[]
  data: any[]
  searchable?: boolean
  searchPlaceholder?: string
  pagination?: boolean
  pageSize?: number
  onRowClick?: (row: any) => void
  emptyMessage?: string
  loading?: boolean
  className?: string
}

type SortDir = 'asc' | 'desc'

export function DataTable({
  columns,
  data,
  searchable = false,
  searchPlaceholder = 'Search...',
  pagination = false,
  pageSize = 20,
  onRowClick,
  emptyMessage = 'No data found',
  loading = false,
  className,
}: DataTableProps) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(0)

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key]
        return val != null && String(val).toLowerCase().includes(q)
      }),
    )
  }, [data, search, columns])

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    const copy = [...filtered]
    copy.sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      const cmp = String(aVal).localeCompare(String(bVal))
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [filtered, sortKey, sortDir])

  // Paginate
  const totalPages = pagination ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1
  const safePageIndex = Math.min(page, totalPages - 1)
  const paged = pagination
    ? sorted.slice(safePageIndex * pageSize, (safePageIndex + 1) * pageSize)
    : sorted

  // Reset page when search changes
  React.useEffect(() => {
    setPage(0)
  }, [search])

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function SortIcon({ colKey }: { colKey: string }) {
    if (sortKey !== colKey) {
      return (
        <ChevronUp
          className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity"
          strokeWidth={2}
        />
      )
    }
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5" strokeWidth={2.5} />
    ) : (
      <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.5} />
    )
  }

  // Skeleton rows for loading state
  if (loading) {
    return (
      <div className={cn('w-full', className)}>
        {searchable && (
          <div className="mb-4">
            <div className="h-10 rounded-[var(--r-md)] bg-[var(--bg-soft)] animate-pulse" />
          </div>
        )}
        <div className="rounded-[var(--r-lg)] border border-[var(--line)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--surface-2)]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--muted)', width: col.width }}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--line-2)] last:border-0">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <div
                        className="h-4 rounded bg-[var(--bg-soft)] animate-pulse"
                        style={{ width: `${50 + Math.random() * 40}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Search */}
      {searchable && (
        <div className="mb-4 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--muted-2)' }}
            strokeWidth={2}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className={cn(
              'w-full h-10 pl-9 pr-3 rounded-[var(--r-md)]',
              'border border-[var(--line)] bg-[var(--bg)]',
              'text-sm text-[var(--ink)] placeholder-[var(--muted-2)]',
              'focus:outline-2 focus:outline-offset-2 focus:outline-[var(--blue)]',
              'transition-colors',
            )}
          />
        </div>
      )}

      {/* Table */}
      <div className="rounded-[var(--r-lg)] border border-[var(--line)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-[var(--line)] bg-[var(--surface-2)]">
                {columns.map((col) => {
                  const isSorted = sortKey === col.key
                  return (
                    <th
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider',
                        col.sortable && 'cursor-pointer select-none group',
                      )}
                      style={{
                        color: isSorted ? 'var(--blue)' : 'var(--muted)',
                        width: col.width,
                      }}
                      onClick={col.sortable ? () => handleSort(col.key) : undefined}
                      aria-sort={
                        isSorted
                          ? sortDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : undefined
                      }
                      tabIndex={col.sortable ? 0 : undefined}
                      onKeyDown={
                        col.sortable
                          ? (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleSort(col.key)
                              }
                            }
                          : undefined
                      }
                      role={col.sortable ? 'columnheader' : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.header}
                        {col.sortable && <SortIcon colKey={col.key} />}
                      </span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-sm"
                    style={{ color: 'var(--muted)' }}
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paged.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className={cn(
                      'border-b border-[var(--line-2)] last:border-0',
                      'transition-colors hover:bg-[var(--bg-soft)]',
                      onRowClick && 'cursor-pointer',
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              onRowClick(row)
                            }
                          }
                        : undefined
                    }
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? 'button' : undefined}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-4 py-3.5 text-sm"
                        style={{ color: 'var(--ink)' }}
                      >
                        {col.render
                          ? col.render(row[col.key], row)
                          : row[col.key] ?? '\u2014'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && sorted.length > 0 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-sm" style={{ color: 'var(--muted)' }}>
            Page {safePageIndex + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePageIndex === 0}
              aria-label="Previous page"
              className={cn(
                'inline-flex items-center justify-center w-8 h-8 rounded-[var(--r-sm)]',
                'border border-[var(--line)] bg-[var(--bg)]',
                'transition-colors hover:bg-[var(--bg-soft)]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'cursor-pointer',
              )}
            >
              <ChevronLeft className="w-4 h-4" style={{ color: 'var(--ink)' }} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePageIndex >= totalPages - 1}
              aria-label="Next page"
              className={cn(
                'inline-flex items-center justify-center w-8 h-8 rounded-[var(--r-sm)]',
                'border border-[var(--line)] bg-[var(--bg)]',
                'transition-colors hover:bg-[var(--bg-soft)]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'cursor-pointer',
              )}
            >
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--ink)' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
