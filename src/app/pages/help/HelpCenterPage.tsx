import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown, LifeBuoy, Search, ArrowRight,
  Rocket, Building2, PiggyBank, Sparkles, Settings, Wrench, LayoutGrid,
} from 'lucide-react'
import { HeroSection } from '@/app/components/ui/HeroSection'

type HelpArticle = {
  id: string
  question: string
  answer: string
}

type HelpCategory = {
  title: string
  description: string
  articles: HelpArticle[]
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Getting Started':   Rocket,
  'Founders':          Building2,
  'Investors':         PiggyBank,
  'AI, News & Events': Sparkles,
  'Account':           Settings,
  'Troubleshooting':   Wrench,
}

const HELP_CATEGORIES: HelpCategory[] = [
  {
    title: 'Getting Started',
    description: 'First login and onboarding walkthrough.',
    articles: [
      {
        id: 'first-login',
        question: 'First login — what happens',
        answer: [
          "1. Sign up with email + password. Check your inbox for the verification link; you cannot sign in until email is verified.",
          "2. Once verified, log in. You'll land on an onboarding flow: pick 'I am an Investor' or 'I am a Founder' and hit Continue.",
          "3. Fill each step (name, sector focus, stage, ticket size for investors / company details, raise info for founders). Everything is saved as you go.",
          "4. On the last step, click Finish — you'll be taken to your personalised dashboard.",
        ].join('\n\n'),
      },
      {
        id: 'verify-email',
        question: "I didn't get the verification email",
        answer: [
          '• Check spam / promotions folder first — the verify link comes from "no-reply@mail.app.supabase.io".',
          '• Click "Resend verification email" on the /auth/verify-email page — there\'s a 60-second cooldown to prevent abuse.',
          '• If still nothing after 10 minutes, use Contact → Technical Issue and include the email you signed up with. We\'ll verify manually.',
        ].join('\n'),
      },
      {
        id: 'dashboard-tour',
        question: 'What\'s on my dashboard',
        answer: [
          '• Left sidebar = navigation. Click the arrow at top-left to collapse it.',
          '• Founder dashboard: My Listing, Browse Investors, Trending, News Feed, Funding Tracker, Ask AI, Introductions, Events.',
          '• Investor dashboard: Dashboard KPIs, Browse Startups, Portfolio, Co-Invest, Trending, News, Events, Ask AI, Intros.',
          '• Top-right bell = notifications (click a row or the bell to open the full history).',
        ].join('\n'),
      },
    ],
  },
  {
    title: 'Founders',
    description: 'Publish your listing and send intro requests.',
    articles: [
      {
        id: 'publish-listing',
        question: 'Publishing your startup listing',
        answer: [
          '1. Sidebar → My Listing.',
          '2. Fill Basic Info (company name, sector, stage, website, LinkedIn, founded year, team size).',
          '3. Fundraising tab: ARR, MoM growth, amount raising, previous investors.',
          '4. Story tab: problem, target market, use of funds, founder bio.',
          '5. Media tab: upload a PDF pitch deck (≤25 MB).',
          '6. Save Changes — your listing enters the admin review queue. Approval usually takes < 24h. Once approved, investors can see you under Browse Startups.',
        ].join('\n'),
      },
      {
        id: 'upload-deck',
        question: 'Upload / update my pitch deck',
        answer: [
          '1. My Listing → Media tab → "Upload pitch deck" → pick a PDF (max 25 MB).',
          '2. Wait for the toast "Deck uploaded". The link shown is private — only you and the admin team can view it until an investor accepts your intro request.',
          '3. To replace: upload again, it overwrites the previous file at the same path.',
        ].join('\n'),
      },
      {
        id: 'send-intro',
        question: 'Send an intro request to an investor',
        answer: [
          '1. Sidebar → Browse Investors.',
          '2. Filter by stage / sector / geography. Click a card to see the full profile.',
          '3. Click "Request Intro" and write a short (2-4 sentence) message explaining why you\'re a fit. Send.',
          '4. The investor gets a notification. You\'ll see the status in Sidebar → Introductions as "pending". Once accepted, both sides exchange email and move the conversation off-platform.',
          '5. Free plan: 3 intro requests/day. Pro: 30/day. Enterprise: unlimited.',
        ].join('\n'),
      },
      {
        id: 'profile-vs-listing',
        question: "What's the difference between Profile and My Listing",
        answer: [
          '• **Profile** (Settings → Profile) = your personal details: name, bio, avatar. Shared across both investor and founder surfaces.',
          '• **My Listing** = your company\'s public presence on the marketplace: the numbers, story, deck, raise terms.',
          '• Company name is synced automatically between the two — editing it in either place updates both.',
        ].join('\n'),
      },
    ],
  },
  {
    title: 'Investors',
    description: 'Discovery, intros, and portfolio tracking.',
    articles: [
      {
        id: 'browse-startups',
        question: 'Find startups that match my thesis',
        answer: [
          '1. Sidebar → Browse Startups.',
          '2. Use the filter chips at the top for Sector / Stage / Geography / Check size.',
          '3. Click a startup card to open the full profile: metrics, problem statement, pitch deck link, founder bio.',
          '4. Click "Send Intro Request" to reach out. The founder gets notified and can accept or decline.',
        ].join('\n'),
      },
      {
        id: 'investor-preferences',
        question: 'Set / change my investment preferences',
        answer: [
          '1. Sidebar → Investor Profile.',
          '2. Public Profile tab: name, fund name, bio, LinkedIn, website.',
          '3. Investment Preferences tab: sectors, stages, geographies, ticket size min/max, investment thesis.',
          '4. Save Profile. These feed into the matching signals on Browse Startups.',
        ].join('\n'),
      },
      {
        id: 'respond-to-intro',
        question: 'Respond to a founder\'s intro request',
        answer: [
          '1. Bell icon → click the "new intro request" notification, OR Sidebar → Introductions.',
          '2. Review the founder\'s message + their startup\'s listing.',
          '3. Accept to exchange contact details (conversation moves to email), or Decline with an optional reason.',
          '4. Responses are one-click; founders see your decision in their own Introductions queue.',
        ].join('\n'),
      },
      {
        id: 'add-portfolio',
        question: 'Track an investment in my portfolio',
        answer: [
          '1. Sidebar → Portfolio → "Add Investment".',
          '2. Fill company name, sector, stage at entry, amount invested, investment date, notes.',
          '3. Save. The dashboard rolls up totals and lets you mark an entry as "exited" later.',
        ].join('\n'),
      },
    ],
  },
  {
    title: 'AI, News & Events',
    description: 'Ask AI, Trending, News Feed, Events section.',
    articles: [
      {
        id: 'ask-ai',
        question: 'Using Ask AI',
        answer: [
          'Sidebar → Ask AI. Pick a mode (Market Intelligence / Fundraising Coach). Type a question or pick a suggested one. AI responds inline — no emails, no saving to a public place.',
          '',
          'Your chat history is stored per-user, per-mode so you can pick up where you left off. Delete a session from the Recent list.',
          '',
          "Pro tip: for Fundraising Coach, paste your own numbers (ARR, growth, prior round) — the coach personalises advice instead of giving generic answers.",
        ].join('\n'),
      },
      {
        id: 'news-feed',
        question: 'News Feed — what is this',
        answer: [
          'Aggregated India-startup news, auto-refreshed every 6 hours from 8 trusted sources (YourStory, Inc42, Economic Times, Moneycontrol, Mint Startups, The Ken, Google News, Hindu Business). Filter by category (Funding / Markets / Policy / etc.) or sector.',
        ].join('\n'),
      },
      {
        id: 'trending',
        question: 'Trending Startups — how it works',
        answer: [
          'A daily-refreshed list of Indian startups in the news. Ranked by recency, funding amount, and "heat" (HOT = raised in the last 24h and > ₹1 Cr). Click any card to read the source article.',
        ].join('\n'),
      },
      {
        id: 'events',
        question: 'Find upcoming startup events',
        answer: [
          'Sidebar → Events. Scraped daily from NASSCOM, TiE, Eventbrite, Meetup, YourStory Events, Startup India, and others. Filter by city / type (Conference / Workshop / Hackathon / Networking) / online-vs-in-person. Click "Register Now" on any card to open the event\'s registration page.',
        ].join('\n'),
      },
    ],
  },
  {
    title: 'Account',
    description: 'Settings, privacy, and security.',
    articles: [
      {
        id: 'change-email-pw',
        question: 'Change my email or password',
        answer: [
          '• **Password**: Settings → Account → "Change password". You\'ll need your current password to confirm.',
          '• **Email**: currently the primary email can\'t be changed from the UI; file a Contact → Technical Issue ticket and the admin team will do it for you (requires verification).',
          '• **Forgot password**: on /auth/login click "Forgot password?" — a reset link is emailed.',
        ].join('\n'),
      },
      {
        id: 'privacy-toggles',
        question: 'Privacy controls — what each toggle does',
        answer: [
          'Settings → Privacy:',
          '• **Show profile to investors/founders** — ON by default. Turn OFF to temporarily hide yourself from the marketplace (useful when fundraising closes).',
          '• **Allow intro requests** — accept incoming requests from the other side. OFF means your profile is visible but the "Send Intro" button is disabled for others.',
          '• **Show in search results** — toggle whether search on the platform surfaces your profile.',
          '',
          'Click Save Privacy Settings to persist. Changes take effect immediately.',
        ].join('\n'),
      },
      {
        id: 'notifications-prefs',
        question: 'Customise what I get notified about',
        answer: [
          'Settings → Notifications. Independent toggles for in-app vs email, per category (intro requests, intro responses, admin broadcasts, application status, weekly digest).',
        ].join('\n'),
      },
      {
        id: 'delete-account',
        question: 'Delete my account',
        answer: [
          'Settings → Account → "Delete account". This is a two-step confirmation. On delete: your profile is soft-deleted (hidden everywhere), your data is retained for 30 days for audit, then purged. You can request full GDPR deletion via /gdpr.',
        ].join('\n'),
      },
    ],
  },
  {
    title: 'Troubleshooting',
    description: 'Common fixes.',
    articles: [
      {
        id: 'cant-login',
        question: "I can't sign in",
        answer: [
          '1. Check that your email is verified (see "I didn\'t get the verification email" above).',
          '2. Use "Forgot password?" on the login page to reset.',
          '3. Clear your browser cache / cookies and try again.',
          '4. If it still fails, Contact → Technical Issue with your account email and a screenshot.',
        ].join('\n'),
      },
      {
        id: 'intro-not-sent',
        question: "My intro request won't send",
        answer: [
          '• Free users hit 3 requests/day. Look at the error banner — if it says "quota_exceeded", upgrade to Pro or wait until midnight UTC.',
          '• Founders: the target needs to be an active platform investor. Scraped investor profiles (grey badge) have no Send Intro button — use the email link instead.',
          "• If you see an RLS error, it's a backend bug — report it via Report a Bug.",
        ].join('\n'),
      },
      {
        id: 'avatar-fails',
        question: "Avatar upload says 'failed'",
        answer: [
          'Accepted: JPG, PNG, WebP, GIF, ≤ 5 MB. Try again with a smaller image; the first attempt sometimes fails while Supabase creates the per-user folder.',
        ].join('\n'),
      },
      {
        id: 'report-bug',
        question: 'Report a bug',
        answer: [
          "Sidebar → Contact → scroll down to 'Report a bug'. Pick a severity, describe steps-to-reproduce, what you expected vs what happened, and attach a screenshot if possible. Admins see these in real time.",
        ].join('\n'),
      },
      {
        id: 'still-stuck',
        question: 'Still stuck — talk to a human',
        answer: [
          "Sidebar → Contact → 'Contact our team'. We aim for < 24h on standard tickets. Include your browser, OS, and (if relevant) the URL you were on — it speeds up triage considerably.",
        ].join('\n'),
      },
    ],
  },
]

// Render inline **bold** spans within a line.
function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4
      ? <strong key={i} style={{ color: 'var(--ink)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>,
  )
}

// Turn an answer string into nicely formatted steps, bullets, and paragraphs.
function ArticleBody({ text }: { text: string }) {
  const lines = text.split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    if (/^\s*\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s/, ''))
        i++
      }
      blocks.push(
        <ol key={key++} className="space-y-2.5">
          {items.map((it, idx) => (
            <li key={idx} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{ background: 'var(--blue-bg)', color: 'var(--blue)', fontFamily: 'var(--font-num)' }}>
                {idx + 1}
              </span>
              <span className="pt-0.5 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{renderInline(it)}</span>
            </li>
          ))}
        </ol>,
      )
    } else if (/^\s*[•-]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[•-]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[•-]\s/, ''))
        i++
      }
      blocks.push(
        <ul key={key++} className="space-y-2">
          {items.map((it, idx) => (
            <li key={idx} className="flex gap-2.5">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--blue)' }} />
              <span className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{renderInline(it)}</span>
            </li>
          ))}
        </ul>,
      )
    } else if (line.trim() === '') {
      i++
    } else {
      blocks.push(
        <p key={key++} className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{renderInline(line)}</p>,
      )
      i++
    }
  }

  return <div className="space-y-3.5">{blocks}</div>
}

export function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(HELP_CATEGORIES[0]?.articles[0]?.id ?? null)

  const totalArticles = useMemo(
    () => HELP_CATEGORIES.reduce((sum, c) => sum + c.articles.length, 0),
    [],
  )

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    let cats = HELP_CATEGORIES
    if (activeCategory !== 'All') cats = cats.filter(c => c.title === activeCategory)

    if (!query) return cats

    return cats
      .map(category => ({
        ...category,
        articles: category.articles.filter(article =>
          article.question.toLowerCase().includes(query) ||
          article.answer.toLowerCase().includes(query),
        ),
      }))
      .filter(category => category.articles.length > 0)
  }, [searchQuery, activeCategory])

  return (
    <div className="max-w-7xl mx-auto px-4 pb-4 space-y-6">
      <HeroSection
        eyebrow="Support Resources"
        title="Help Center"
        subtitle="Find answers, guides, and support resources"
      >
        <div className="relative w-full max-w-md">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 z-10"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          />
          <input
            type="search"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Search help articles…"
            className="w-full rounded-full text-sm outline-0 transition-all"
            style={{
              height: 46,
              paddingLeft: 44,
              paddingRight: 16,
              background: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'white',
              backdropFilter: 'blur(8px)',
            }}
          />
        </div>
      </HeroSection>

      {/* Category navigation */}
      {!searchQuery && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveCategory('All')}
            className="flex items-center gap-3 rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5"
            style={activeCategory === 'All'
              ? { border: '1px solid var(--blue)', background: 'var(--blue-bg)' }
              : { border: '1px solid var(--line)', background: 'var(--surface)' }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
              style={{ background: activeCategory === 'All' ? 'var(--blue)' : 'var(--blue-bg)', color: activeCategory === 'All' ? '#fff' : 'var(--blue)' }}>
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>All Topics</p>
              <p className="text-xs" style={{ color: 'var(--muted-2)' }}>{totalArticles} articles</p>
            </div>
          </button>
          {HELP_CATEGORIES.map(category => {
            const Icon = CATEGORY_ICONS[category.title] ?? LifeBuoy
            const active = activeCategory === category.title
            return (
              <button
                key={category.title}
                onClick={() => setActiveCategory(prev => prev === category.title ? 'All' : category.title)}
                className="flex items-center gap-3 rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5"
                style={active
                  ? { border: '1px solid var(--blue)', background: 'var(--blue-bg)' }
                  : { border: '1px solid var(--line)', background: 'var(--surface)' }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                  style={{ background: active ? 'var(--blue)' : 'var(--blue-bg)', color: active ? '#fff' : 'var(--blue)' }}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>{category.title}</p>
                  <p className="text-xs" style={{ color: 'var(--muted-2)' }}>{category.articles.length} articles</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div className="grid gap-5">
        {filteredCategories.map(category => (
          <section
            key={category.title}
            className="rounded-3xl p-6 md:p-7"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              boxShadow: '0 18px 35px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
                {(() => { const Icon = CATEGORY_ICONS[category.title] ?? LifeBuoy; return <Icon className="h-5 w-5" /> })()}
              </div>
              <div>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--ink)' }}>
                  {category.title}
                </h2>
                <p className="mt-0.5 text-sm" style={{ color: 'var(--muted-2)' }}>
                  {category.description}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {category.articles.map(article => {
                const isOpen = expandedArticleId === article.id

                return (
                  <div
                    key={article.id}
                    className="overflow-hidden rounded-2xl"
                    style={{
                      border: '1px solid var(--line)',
                      background: isOpen ? 'var(--surface-2)' : 'var(--surface)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedArticleId(current => current === article.id ? null : article.id)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors"
                    >
                      <h3 className="text-sm font-semibold md:text-[15px]" style={{ color: isOpen ? 'var(--blue)' : 'var(--ink)', letterSpacing: '-0.01em' }}>
                        {article.question}
                      </h3>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.18 }}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                        style={{ background: isOpen ? 'var(--blue-bg)' : 'var(--surface-2)' }}
                      >
                        <ChevronDown className="h-3.5 w-3.5" style={{ color: isOpen ? 'var(--blue)' : 'var(--muted-2)' }} />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                        >
                          <div className="px-5 pb-5" style={{ borderTop: '1px solid var(--line)' }}>
                            <div className="pt-4">
                              <ArticleBody text={article.answer} />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        {filteredCategories.length === 0 && (
          <section
            className="rounded-3xl p-8 text-center"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              boxShadow: '0 18px 35px rgba(15, 23, 42, 0.05)',
            }}
          >
            <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>
              No matching articles found
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted-2)' }}>
              Try a different keyword, or reach out directly if you need personal help.
            </p>
          </section>
        )}
      </div>

      <section
        className="rounded-3xl px-6 py-6 md:px-7 md:py-7"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)',
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">Still need help?</p>
            <p className="mt-1 text-sm text-slate-300">
              Contact the FounderCentral support team for account questions, billing help, or bug reports.
            </p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
            style={{
              background: 'var(--surface)',
              color: 'var(--ink)',
              boxShadow: '0 10px 24px rgba(255, 255, 255, 0.16)',
            }}
          >
            Go to Contact <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
