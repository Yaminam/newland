import { useMemo, useState } from 'react'
import {
  BookOpen, ShieldCheck, Users, FileCheck, Flag, Send, LifeBuoy,
  CreditCard, ToggleRight, Megaphone, Newspaper, Activity, FileClock,
  Search,
} from 'lucide-react'

interface Section {
  id:     string
  title:  string
  icon:   React.ElementType
  body:   Array<{ kind: 'p' | 'h3' | 'ul' | 'ol' | 'code'; text?: string; items?: string[] }>
}

const SECTIONS: Section[] = [
  {
    id: 'overview',
    title: 'Overview',
    icon: BookOpen,
    body: [
      { kind: 'p', text:
        'FounderCentral is a discovery-only founder/investor platform. The admin console lives at /admin and is gated by profiles.access_role=\'admin\'. Admin accounts cannot sign in on the mobile apps — the web console is the only admin surface.' },
      { kind: 'p', text:
        'Every mutating action you take is written to audit_log. Impersonation, account creation, application approval, broadcasts, and scraper runs all leave a trail with your id, IP, user-agent, a before/after diff and an optional reason.' },
    ],
  },
  {
    id: 'applications',
    title: 'Applications',
    icon: FileCheck,
    body: [
      { kind: 'p', text:
        'Founders submit startup applications to be listed in the investor marketplace. Every submission starts in status=\'submitted\' and needs your review.' },
      { kind: 'h3', text: 'Approve' },
      { kind: 'ul', items: [
        'Does the company exist (search LinkedIn / a press mention)?',
        'Is the founder who they say they are (matching LinkedIn profile)?',
        'Is the pitch coherent — sector, stage, ask, traction?',
        'Optional: set a trust_badge (Verified / Founded / etc.) that investors see on the listing.',
      ] },
      { kind: 'p', text:
        'Approving flips founder_profiles.verified=TRUE via a DB trigger. A notification + email goes to the founder automatically.' },
      { kind: 'h3', text: 'Reject' },
      { kind: 'p', text:
        'Always provide notes. The rejection email to the founder includes them verbatim, so write as if the founder will read it.' },
      { kind: 'h3', text: 'Request more info' },
      { kind: 'p', text:
        'Moves status to under_review. Use this for salvageable applications — missing deck, unclear ask, unverifiable claim. Founder sees a notification and can resubmit.' },
      { kind: 'h3', text: 'Bulk actions' },
      { kind: 'p', text:
        'Select multiple rows via checkboxes; the top bar exposes bulk approve and bulk reject (rejection reason applies to all selected).' },
    ],
  },
  {
    id: 'users',
    title: 'Users',
    icon: Users,
    body: [
      { kind: 'p', text:
        'The Users page is where you moderate accounts. The drawer shows intros sent/received, reports against the user, plan, and subscription state from admin_user_overview.' },
      { kind: 'h3', text: 'Warn' },
      { kind: 'p', text:
        'Soft admonishment. Reversible. Users see a banner in-app but retain full access. Use for first-time minor issues.' },
      { kind: 'h3', text: 'Suspend 7d' },
      { kind: 'p', text:
        'Temporarily blocks sign-in and hides the user from the marketplace. Auto-expires. Use for cooling-off periods.' },
      { kind: 'h3', text: 'Ban' },
      { kind: 'p', text:
        'Permanent. Excluded from broadcasts. Does not delete the row — data stays for audit. Only use after confirmed violations.' },
      { kind: 'h3', text: 'Reset password' },
      { kind: 'p', text:
        'Triggers a Supabase password-reset email. The user is not signed out of existing sessions; tell them to refresh.' },
      { kind: 'h3', text: 'Soft delete' },
      { kind: 'p', text:
        'Sets deleted_at. Removes them from lookups and the marketplace. Reversible by clearing deleted_at in the DB — but in practice, treat as permanent.' },
      { kind: 'h3', text: 'Log in as user (impersonation)' },
      { kind: 'p', text:
        'Mints a short-lived magic link for the target user and opens it in a new tab. You see a persistent orange banner while the session is active — click End impersonation to return. Every session is audit-logged with your reason.' },
      { kind: 'h3', text: 'Export user data (GDPR)' },
      { kind: 'p', text:
        'Bundles everything we know about the user into a JSON file: profile, applications, both sides of any introductions, notifications, subs, reports they filed and reports filed against them. Hand to the user when they request their data.' },
    ],
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: Flag,
    body: [
      { kind: 'p', text:
        'Users can report other users from the mobile apps and web for spam, harassment, misrepresentation, inappropriate content, or other. Every report lands here in status=\'open\'.' },
      { kind: 'ol', items: [
        'Open the drawer — it shows previous reports against the same target and any blocks in place.',
        'Decide: dismiss (no violation), mark reviewing (need more info), or actioned (took moderation action).',
        'If actioned, use the inline moderation buttons (warn/suspend/ban) so the report is linked to the action in audit_log.',
      ] },
      { kind: 'p', text:
        'New reports also fire an in-app notification to all admins via DB trigger. Check your notification center.' },
    ],
  },
  {
    id: 'intros',
    title: 'Intros',
    icon: Send,
    body: [
      { kind: 'p', text:
        'Intros are the core product loop. An investor sends one to a founder; the founder accepts or declines; acceptance moves the conversation to email.' },
      { kind: 'p', text:
        'The admin page highlights intros stuck in pending for >7 days. Force actions let you nudge them: force_expire, force_accept (dev only — be careful), force_decline, or extend the expiry by 7 days and notify.' },
      { kind: 'p', text:
        'Acceptance rate (on the dashboard) is the most important health metric. Below 30% means intro quality is poor — look at who the investors are messaging and whether the founder applications are mismatched.' },
    ],
  },
  {
    id: 'support',
    title: 'Support',
    icon: LifeBuoy,
    body: [
      { kind: 'p', text:
        'Three tabs: tickets (user-submitted help requests), bugs (with severity P0-P3), feedback (read-only product feedback), templates (canned response CRUD).' },
      { kind: 'h3', text: 'SLA' },
      { kind: 'p', text:
        'Tickets: 24h target. Bugs by severity: P0 4h, P1 24h, P2 72h, P3 1w. Overdue rows show a red "overdue" pill — treat those as next-up.' },
      { kind: 'h3', text: 'Canned responses' },
      { kind: 'p', text:
        'Open a ticket, scroll to "Canned responses" in the drawer, click Copy. The {{name}} placeholder is auto-filled with the reporter\'s name. Paste into your email client. Usage count is tracked so you can see which templates actually help.' },
    ],
  },
  {
    id: 'broadcasts',
    title: 'Broadcasts',
    icon: Megaphone,
    body: [
      { kind: 'p', text:
        'Announcements to user segments. In-app notifications + optional email.' },
      { kind: 'ul', items: [
        'Preview audience size before sending — banned and soft-deleted users are excluded.',
        'Schedule for later by toggling "Send later" and picking a datetime. The dispatcher runs every 5 minutes via GitHub Actions.',
        'A scheduled broadcast in status=\'scheduled\' can be canceled from the History tab before it fires.',
      ] },
      { kind: 'p', text:
        'Plan-based audiences (plan:free / pro / enterprise) query the subscriptions table live — you always hit the current plan, not who had the plan when you drafted.' },
    ],
  },
  {
    id: 'content',
    title: 'Content',
    icon: Newspaper,
    body: [
      { kind: 'p', text:
        'Curate the feeds users see on web + mobile: news articles, engagement-ranked trending, the public-startup feed, and the scraper jobs that populate them.' },
      { kind: 'h3', text: 'Trending (engagement)' },
      { kind: 'p', text:
        'Built from profile_views, bookmarks, intro requests and deck downloads — weights in refresh-trending. Stays empty until there\'s real user activity; don\'t confuse it with Public startups.' },
      { kind: 'h3', text: 'Public startups' },
      { kind: 'p', text:
        'Projection of funding_rounds into a browsable directory. Populated by the scrape-public-startups job — distinct companies with their most recent round. Hide / feature / delete individual rows as needed.' },
      { kind: 'h3', text: 'Scraper jobs' },
      { kind: 'p', text:
        'All scrapers run as Supabase edge functions on pg_cron schedules. Use the Run now buttons for manual triggers. Each run logs to scraper_runs with items_in/items_written + any error, surfaced both here and in /admin/monitoring.' },
      { kind: 'p', text:
        'Pipeline order: scrape-news populates news_articles, scrape-funding enriches Funding-category articles into funding_rounds, scrape-public-startups projects those into the Browse Startups feed. scrape-events, scrape-grants, scrape-investors run independently.' },
    ],
  },
  {
    id: 'monitoring',
    title: 'Monitoring',
    icon: Activity,
    body: [
      { kind: 'p', text:
        'Three tabs: Platform health (last run per cron job, recent failures, row counts across 12 core tables), Traffic (DAU/WAU/MAU + sparklines over 30 days), Errors (security_events stream).' },
      { kind: 'p', text:
        'DAU/WAU/MAU read from profiles.last_seen_at, which is not yet written by the client — they will show 0 until the auth layer updates the column on sign-in.' },
    ],
  },
  {
    id: 'flags',
    title: 'Feature flags',
    icon: ToggleRight,
    body: [
      { kind: 'p', text:
        'Toggle code-gated features on/off without a release. Code reads a flag via useFeatureFlag(key, fallback).' },
      { kind: 'p', text:
        'Authed users can SELECT (required so client-side gating works). Only admins can write. The hook caches values client-side, so a toggle takes effect on next full page load; use invalidateFeatureFlagCache(key) if you need immediate invalidation.' },
    ],
  },
  {
    id: 'billing',
    title: 'Billing',
    icon: CreditCard,
    body: [
      { kind: 'p', text:
        'Snapshot of subscriptions. Active + trialing headline MRR is computed by price × status — tune the PLAN_PRICE_USD map in BillingPage.tsx if you change pricing.' },
      { kind: 'p', text:
        'Payment issues (failed_payment_attempts > 0 or status=past_due or suspended_at) bubble to the top — treat as the follow-up queue. Real numbers for accounting come from Stripe, not this page.' },
    ],
  },
  {
    id: 'admins',
    title: 'Admin team',
    icon: ShieldCheck,
    body: [
      { kind: 'p', text:
        'Lists all access_role=admin accounts. Invite adds an auth user, seeds profiles with admin role, and returns a 24-char temp password once — copy it immediately.' },
      { kind: 'p', text:
        'You cannot revoke your own admin, and you cannot revoke the last admin. Revocation flips access_role=\'user\'; the account keeps all other access.' },
    ],
  },
  {
    id: 'audit',
    title: 'Audit log',
    icon: FileClock,
    body: [
      { kind: 'p', text:
        'Read-only. Every mutating admin action appends a row: actor_id, acted_on, entity, action, before/after JSON diffs, reason, IP, user_agent.' },
      { kind: 'p', text:
        'Filter by entity type (profile / user_moderation / startup_application / introduction / admin_broadcast / scraper_run / impersonation / user_export) or search action keywords.' },
      { kind: 'p', text:
        'The log lives in Postgres — a rogue admin with direct DB access could mutate it. Treat it as best-effort until we add an external audit sink.' },
    ],
  },
  {
    id: 'shortcuts',
    title: 'Keyboard shortcuts',
    icon: BookOpen,
    body: [
      { kind: 'p', text: 'Press ? anywhere in /admin/* to open the shortcut cheat sheet.' },
      { kind: 'ul', items: [
        'g d → Dashboard, g u → Users, g a → Applications, g r → Reports, g i → Intros, g s → Support',
        'g v → Investors, g n → Broadcasts, g c → Content, g m → Monitoring, g b → Billing',
        'g f → Feature flags, g t → Admin team, g l → Audit log, g h → Help',
        '/ → focus the search input on the current page if any',
        '? → open / close the shortcut help dialog',
      ] },
    ],
  },
]

export function HelpPage() {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return SECTIONS
    return SECTIONS.filter(sec => {
      if (sec.title.toLowerCase().includes(s)) return true
      return sec.body.some(b => {
        if (b.text?.toLowerCase().includes(s)) return true
        if (b.items?.some(i => i.toLowerCase().includes(s))) return true
        return false
      })
    })
  }, [q])

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
          Admin runbook
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          Everything the admin console does, why, and how. Keep this updated as the product changes.
        </p>
      </header>

      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-2)' }} />
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search the runbook…"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl outline-0"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--ink)' }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-8 text-center text-sm"
          style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--muted)' }}>
          No matches.
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map(s => {
            const Icon = s.icon
            return (
              <section key={s.id} id={s.id} className="rounded-2xl p-6"
                style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4" style={{ color: '#6366F1' }} />
                  <h2 className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
                    {s.title}
                  </h2>
                </div>
                <div className="space-y-3 text-sm" style={{ color: 'var(--muted)' }}>
                  {s.body.map((b, i) => {
                    if (b.kind === 'p') {
                      return <p key={i}>{b.text}</p>
                    }
                    if (b.kind === 'h3') {
                      return <h3 key={i} className="text-sm font-semibold mt-4"
                        style={{ color: 'var(--ink)' }}>{b.text}</h3>
                    }
                    if (b.kind === 'ul') {
                      return (
                        <ul key={i} className="list-disc pl-5 space-y-1">
                          {b.items?.map((it, j) => <li key={j}>{it}</li>)}
                        </ul>
                      )
                    }
                    if (b.kind === 'ol') {
                      return (
                        <ol key={i} className="list-decimal pl-5 space-y-1">
                          {b.items?.map((it, j) => <li key={j}>{it}</li>)}
                        </ol>
                      )
                    }
                    return null
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
