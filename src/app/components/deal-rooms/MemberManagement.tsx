import { useState, useCallback, useEffect, useRef } from 'react'
import { UserPlus, X, Search, Sparkles, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/app/lib/supabase'
import { Button } from '@/app/components/ui/Button'
import { useAuth } from '@/app/context/AuthContext'
import type { DealRoomMember, SubRoomInfo, DealRoomInvite } from '@/app/hooks/useDealRooms'

type MemberStatus = 'accepted' | 'pending' | 'requesting' | 'rejected' | 'expired'

interface MemberEntry {
  key: string
  investorId: string
  name: string
  company: string | null
  avatar: string | null
  status: MemberStatus
}

const STATUS_META: Record<MemberStatus, { label: string; color: string; bg: string }> = {
  accepted:   { label: 'Accepted',   color: 'var(--pos)',           bg: 'var(--pos-bg, #F0FDF4)' },
  pending:    { label: 'Pending',    color: 'var(--warn, #D97706)', bg: 'var(--warn-bg, #FFFBEB)' },
  requesting: { label: 'Requesting', color: 'var(--blue)',          bg: 'var(--blue-bg)' },
  rejected:   { label: 'Rejected',   color: 'var(--neg)',           bg: 'var(--neg-bg, #FEF2F2)' },
  expired:    { label: 'Expired',    color: 'var(--muted-2)',       bg: 'var(--surface-3)' },
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const m = STATUS_META[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-1 rounded-full"
      style={{ color: m.color, background: m.bg, letterSpacing: '0.03em' }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  )
}

interface Props {
  members: DealRoomMember[]
  /** Sub-rooms list for founder view — shows investor from each sub-room */
  subRooms?: SubRoomInfo[]
  /** Pending invites (founder view) — investors who haven't accepted yet */
  pendingInvites?: DealRoomInvite[]
  isOwner: boolean
  /** Single-column layout for narrow containers (e.g. sidebar). */
  compact?: boolean
  /** Whether the room has a PIN set — controls visibility of "Email PIN" button. */
  hasPin?: boolean
  onInvite: (userId: string, userName: string) => Promise<boolean>
  onRevoke: (userId: string, userName: string) => Promise<boolean>
  /** Sends the PIN to all active investor members via email. */
  onSendPin?: (pin: string) => Promise<{ success: boolean; sent?: number; error?: string }>
}

interface SearchResult {
  id: string
  full_name: string | null
  company: string | null
  avatar_url: string | null
}

interface Suggestion extends SearchResult {
  score: number
}

function scoreColor(score: number): string {
  return score >= 75 ? 'var(--pos)' : score >= 50 ? 'var(--blue)' : 'var(--warn)'
}

export function MemberManagement({ members, subRooms, pendingInvites, isOwner, compact = false, hasPin, onInvite, onRevoke, onSendPin }: Props) {
  const { user } = useAuth()
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const suggestionsLoaded = useRef(false)
  const [confirmRevoke, setConfirmRevoke] = useState<{ investorId: string; name: string } | null>(null)
  const [revoking, setRevoking] = useState(false)
  const [optimisticallyRevoked, setOptimisticallyRevoked] = useState<Set<string>>(new Set())

  // PIN email modal state
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinDigits, setPinDigits] = useState<[string, string, string, string]>(['', '', '', ''])
  const [sendingPin, setSendingPin] = useState(false)
  const [pinError, setPinError] = useState<string | null>(null)
  const pinInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const openPinModal = () => {
    setPinDigits(['', '', '', ''])
    setPinError(null)
    setShowPinModal(true)
  }

  const handlePinDigit = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...pinDigits] as [string, string, string, string]
    next[idx] = digit
    setPinDigits(next)
    setPinError(null)
    if (digit && idx < 3) pinInputRefs[idx + 1].current?.focus()
  }

  const handlePinKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[idx] && idx > 0) {
      pinInputRefs[idx - 1].current?.focus()
    }
  }

  const handleSendPin = async () => {
    if (!onSendPin) return
    const pin = pinDigits.join('')
    if (pin.length !== 4) { setPinError('Enter all 4 digits'); return }
    setSendingPin(true)
    setPinError(null)
    const result = await onSendPin(pin)
    setSendingPin(false)
    if (!result.success) {
      setPinError(result.error ?? 'Failed to send emails')
    } else {
      setShowPinModal(false)
      toast.success(
        result.sent === 0
          ? 'No active investors to notify'
          : `PIN emailed to ${result.sent} investor${result.sent === 1 ? '' : 's'}`,
      )
    }
  }

  // If subRooms provided (founder view), show investors from sub-rooms
  // Otherwise (investor view), show direct members
  const useSubRoomView = !!subRooms

  const activeMembers = members.filter(m => !m.revoked_at)

  // Existing investor IDs — used to hide already-invited/accepted investors from search results.
  // Revoked investors are intentionally excluded so founders can re-invite them.
  const existingInvestorIds = useSubRoomView
    ? new Set([
        ...subRooms!.map(s => s.investor_id),
        ...(pendingInvites ?? []).map(inv => inv.investor_id),
      ])
    : new Set(activeMembers.map(m => m.user_id))

  // Load top-5 AI-matched investors as suggestions
  const loadSuggestions = useCallback(async () => {
    if (!user?.id) return
    setSuggestLoading(true)
    const { data: matchRows } = await supabase
      .from('matches')
      .select('investor_id, score')
      .eq('founder_id', user.id)
      .eq('is_active', true)
      .order('score', { ascending: false })
      .limit(5)
    const ids = (matchRows ?? []).map(m => m.investor_id)
    if (!ids.length) { setSuggestions([]); setSuggestLoading(false); return }
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, full_name, company, avatar_url')
      .in('id', ids)
    const profById = Object.fromEntries((profs ?? []).map(p => [p.id, p]))
    const merged = (matchRows ?? [])
      .map(m => {
        const p = profById[m.investor_id]
        if (!p) return null
        return { id: p.id, full_name: p.full_name, company: p.company, avatar_url: p.avatar_url, score: Number(m.score) }
      })
      .filter((s): s is Suggestion => s !== null)
    setSuggestions(merged)
    setSuggestLoading(false)
  }, [user?.id])

  // Lazily fetch suggestions the first time the search panel opens
  useEffect(() => {
    if (showSearch && !suggestionsLoaded.current) {
      suggestionsLoaded.current = true
      loadSuggestions()
    }
  }, [showSearch, loadSuggestions])

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q)
    if (q.trim().length < 2) { setResults([]); return }
    setSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, company, avatar_url')
      .eq('role', 'investor')
      .or(`full_name.ilike.%${q}%,company.ilike.%${q}%`)
      .limit(8)
    setSearching(false)
    setResults((data ?? []).filter(r => !existingInvestorIds.has(r.id)))
  }, [existingInvestorIds])

  const handleInvite = async (u: SearchResult) => {
    await onInvite(u.id, u.full_name ?? 'Investor')
    setResults(r => r.filter(x => x.id !== u.id))
    setSuggestions(s => s.filter(x => x.id !== u.id))
    setQuery('')
  }

  const showSuggestions = query.trim().length < 2
  const visibleSuggestions = suggestions.filter(s => !existingInvestorIds.has(s.id))

  // Unified, owner-excluded member list with status badges.
  // Founder view: union of parent-room viewers (where invites land) and
  // sub-rooms, deduped by investor — so every invited investor shows up.
  const memberEntries: MemberEntry[] = (() => {
    if (!useSubRoomView) {
      return activeMembers
        .filter(m => m.role !== 'owner')
        .map(m => ({
          key: m.id,
          investorId: m.user_id,
          name: m.profile?.full_name ?? 'Member',
          company: m.profile?.company ?? null,
          avatar: m.profile?.avatar_url ?? null,
          status: 'accepted' as MemberStatus,
        }))
    }

    const byInvestor = new Map<string, MemberEntry>()

    // 1) Active parent-room members (accepted viewers)
    for (const m of activeMembers) {
      if (m.role === 'owner') continue
      byInvestor.set(m.user_id, {
        key: m.id,
        investorId: m.user_id,
        name: m.profile?.full_name ?? 'Investor',
        company: m.profile?.company ?? null,
        avatar: m.profile?.avatar_url ?? null,
        status: 'accepted' as MemberStatus,
      })
    }

    // 2) Sub-rooms (richer investor name/avatar; fills any gaps)
    for (const sub of subRooms ?? []) {
      if (byInvestor.has(sub.investor_id)) continue
      byInvestor.set(sub.investor_id, {
        key: sub.id,
        investorId: sub.investor_id,
        name: sub.investor_name ?? 'Investor',
        company: null,
        avatar: sub.investor_avatar,
        status: 'accepted',
      })
    }

    // 3) Pending invites (invited but not yet accepted)
    for (const inv of pendingInvites ?? []) {
      if (byInvestor.has(inv.investor_id)) continue
      byInvestor.set(inv.investor_id, {
        key: `invite-${inv.id}`,
        investorId: inv.investor_id,
        name: inv.investor?.full_name ?? 'Investor',
        company: inv.investor?.company ?? null,
        avatar: inv.investor?.avatar_url ?? null,
        status: 'pending',
      })
    }

    // Revoked members are intentionally not shown — they disappear after remove.
    // Founders can re-invite them via "Add Investor" (revoked IDs are excluded from existingInvestorIds).

    return [...byInvestor.values()]
  })()

  const visibleEntries = memberEntries.filter(e => !optimisticallyRevoked.has(e.investorId))

  return (
    <div className="flex flex-col gap-3">
      {/* Owner action buttons */}
      {isOwner && (
        <div className="flex items-center gap-2 flex-wrap">
          {!showSearch && (
            <Button variant="secondary" size="sm" iconLeft={UserPlus} onClick={() => setShowSearch(true)}>
              Add Investor
            </Button>
          )}
          {!showSearch && hasPin && onSendPin && (
            <Button variant="secondary" size="sm" iconLeft={Mail} onClick={openPinModal}>
              Email PIN to Investors
            </Button>
          )}
        </div>
      )}

      {/* Add member search panel */}
      {isOwner && showSearch && (
        <div className="flex flex-col gap-2 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-2)' }} />
            <input
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search investors by name or company..."
              autoFocus
              className="w-full h-9 pl-9 pr-3 text-[13px] rounded-[var(--r-md)] border border-[var(--line)] focus:border-[var(--blue)] focus:outline-none"
              style={{ background: 'var(--bg)', color: 'var(--ink)' }}
            />
          </div>
          {showSuggestions ? (
            suggestLoading ? (
              <p className="text-[12px] text-center py-3" style={{ color: 'var(--muted-2)' }}>Loading suggestions…</p>
            ) : visibleSuggestions.length > 0 ? (
              <div
                className="rounded-[var(--r-md)] border border-[var(--line)] overflow-hidden"
                style={{ background: 'var(--surface)' }}
              >
                <div
                  className="flex items-center gap-1.5 px-3 py-2"
                  style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--line)' }}
                >
                  <Sparkles className="w-3 h-3" style={{ color: '#8b5cf6' }} />
                  <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--muted-2)', letterSpacing: '0.05em' }}>
                    Top AI matches
                  </span>
                </div>
                {visibleSuggestions.map(s => (
                  <InviteRow key={s.id} user={s} score={s.score} onInvite={() => handleInvite(s)} />
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-center py-2" style={{ color: 'var(--muted-2)' }}>
                Start typing to search investors by name or company.
              </p>
            )
          ) : (
            <>
              {results.length > 0 && (
                <div
                  className="rounded-[var(--r-md)] border border-[var(--line)] overflow-hidden"
                  style={{ background: 'var(--surface)' }}
                >
                  {results.map(u => (
                    <InviteRow key={u.id} user={u} onInvite={() => handleInvite(u)} />
                  ))}
                </div>
              )}
              {results.length === 0 && !searching && (
                <p className="text-[12px] text-center py-2" style={{ color: 'var(--muted-2)' }}>
                  No investors found
                </p>
              )}
            </>
          )}
          <button
            onClick={() => { setShowSearch(false); setQuery(''); setResults([]) }}
            className="text-[12px] font-medium self-end cursor-pointer"
            style={{ color: 'var(--muted)' }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Member list — owner excluded, status-driven grid of cards */}
      {visibleEntries.length === 0 ? (
        <div className="text-[12px] text-center py-6 rounded-[12px] border border-[var(--line)]" style={{ color: 'var(--muted-2)', background: 'var(--surface)' }}>
          No members yet.{isOwner ? ' Add an investor to get started.' : ''}
        </div>
      ) : (
        <div className={compact ? 'grid grid-cols-1 gap-2.5' : 'grid grid-cols-1 sm:grid-cols-2 gap-2.5'}>
          {visibleEntries.map(entry => (
            <div
              key={entry.key}
              className="flex items-center gap-3 p-3.5 rounded-[12px] border border-[var(--line)] transition-colors hover:bg-[var(--bg-soft)] group"
              style={{ background: 'var(--surface)' }}
            >
              {entry.avatar ? (
                <img src={entry.avatar} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
                  style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
                >
                  {entry.name[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink)' }}>
                  {entry.name}
                </p>
                <p className="text-[11px] truncate" style={{ color: 'var(--muted-2)' }}>
                  {entry.company ?? 'Investor'}
                </p>
              </div>
              <StatusBadge status={entry.status} />
              {isOwner && entry.status !== 'rejected' && (
                <button
                  onClick={() => setConfirmRevoke({ investorId: entry.investorId, name: entry.name })}
                  className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--bg-soft)] cursor-pointer shrink-0"
                  title="Remove investor"
                >
                  <X className="w-3.5 h-3.5" style={{ color: 'var(--neg)' }} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {/* PIN email modal */}
      {showPinModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => !sendingPin && setShowPinModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-[18px] p-6 flex flex-col gap-5 shadow-xl"
            style={{ background: 'var(--surface)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: 'var(--blue-bg)' }}>
                  <Mail className="w-4 h-4" style={{ color: 'var(--blue)' }} />
                </div>
                <p className="text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>
                  Email PIN to Investors
                </p>
              </div>
              <p className="text-[13px]" style={{ color: 'var(--muted)' }}>
                Enter the room PIN to confirm, then we'll email it to all active investors.
              </p>
            </div>

            {/* 4-digit PIN input */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-3">
                {pinDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={pinInputRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handlePinDigit(idx, e.target.value)}
                    onKeyDown={e => handlePinKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-[22px] font-bold rounded-[12px] border-2 focus:outline-none transition-colors"
                    style={{
                      background: 'var(--bg)',
                      color: 'var(--ink)',
                      borderColor: pinError ? 'var(--neg)' : digit ? 'var(--blue)' : 'var(--line)',
                    }}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
              {pinError && (
                <p className="text-[12px] font-medium" style={{ color: 'var(--neg)' }}>
                  {pinError}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <button
                disabled={sendingPin}
                onClick={() => setShowPinModal(false)}
                className="px-4 py-2 rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer"
                style={{ background: 'var(--surface-2)', color: 'var(--ink)' }}
              >
                Cancel
              </button>
              <button
                disabled={sendingPin || pinDigits.join('').length !== 4}
                onClick={handleSendPin}
                className="px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-opacity cursor-pointer inline-flex items-center gap-2"
                style={{
                  background: 'var(--blue)',
                  color: '#fff',
                  opacity: sendingPin || pinDigits.join('').length !== 4 ? 0.6 : 1,
                }}
              >
                {sendingPin ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5" />
                    Send PIN
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke confirmation dialog */}
      {confirmRevoke && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => !revoking && setConfirmRevoke(null)}
        >
          <div
            className="w-full max-w-sm rounded-[18px] p-6 flex flex-col gap-4 shadow-xl"
            style={{ background: 'var(--surface)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1.5">
              <p className="text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>
                Remove investor?
              </p>
              <p className="text-[13px]" style={{ color: 'var(--muted)' }}>
                <span className="font-medium" style={{ color: 'var(--ink)' }}>{confirmRevoke.name}</span> will lose access to this deal room. You can re-invite them later.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                disabled={revoking}
                onClick={() => setConfirmRevoke(null)}
                className="px-4 py-2 rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer"
                style={{ background: 'var(--surface-2)', color: 'var(--ink)' }}
              >
                Cancel
              </button>
              <button
                disabled={revoking}
                onClick={async () => {
                  setRevoking(true)
                  setOptimisticallyRevoked(prev => new Set([...prev, confirmRevoke.investorId]))
                  setConfirmRevoke(null)
                  await onRevoke(confirmRevoke.investorId, confirmRevoke.name)
                  setRevoking(false)
                }}
                className="px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-opacity cursor-pointer"
                style={{ background: 'var(--neg)', color: '#fff', opacity: revoking ? 0.6 : 1 }}
              >
                {revoking ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InviteRow({ user, score, onInvite }: { user: SearchResult; score?: number; onInvite: () => void }) {
  const c = score != null ? scoreColor(score) : undefined
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--bg-soft)] transition-colors">
      {user.avatar_url ? (
        <img src={user.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
      ) : (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
          style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}
        >
          {(user.full_name ?? '?')[0].toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-medium truncate" style={{ color: 'var(--ink)' }}>
            {user.full_name ?? 'Unknown'}
          </p>
          {c && score != null && (
            <span
              className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-[6px] shrink-0"
              style={{ color: c, background: `color-mix(in srgb, ${c} 14%, transparent)` }}
            >
              {score}
            </span>
          )}
        </div>
        {user.company && (
          <p className="text-[11px] truncate" style={{ color: 'var(--muted)' }}>
            {user.company}
          </p>
        )}
      </div>
      <Button variant="primary" size="sm" iconLeft={UserPlus} onClick={onInvite}>
        Invite
      </Button>
    </div>
  )
}

