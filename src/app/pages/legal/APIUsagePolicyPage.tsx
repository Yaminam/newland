import { Link } from 'react-router-dom'
import { SEO } from '@/app/components/SEO'
import { ArrowLeft, Gauge, KeyRound, Mail, ShieldAlert, TerminalSquare, TriangleAlert } from 'lucide-react'

const sectionStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 20,
  padding: 24,
}

const headingStyle: React.CSSProperties = {
  color: 'var(--ink)',
  fontFamily: 'var(--font-display)',
}

const bodyStyle: React.CSSProperties = {
  color: 'var(--muted)',
  lineHeight: 1.7,
  fontSize: '0.95rem',
}

export function APIUsagePolicyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-2)' }}>
      <SEO
        title="API Usage Policy"
        description="Acceptable use policy for the FounderCentral API. Rate limits, authentication, allowed and disallowed use cases."
        path="/api-usage-policy"
      />
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: 'var(--blue)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>

        <header
          className="rounded-[28px] p-8 md:p-10"
          style={{
            background: 'linear-gradient(145deg, #0F172A 0%, #1D4ED8 52%, #2563EB 100%)',
            color: 'var(--surface)',
          }}
        >
          <div className="max-w-3xl space-y-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <TerminalSquare className="w-7 h-7" />
            </div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: 'var(--surface)' }}>
              API Usage &amp; Abuse Policy
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.7, fontSize: '1rem' }}>
              This policy explains how the FounderCentral API may be used, what behaviors are prohibited, how keys and
              rate limits are managed, and what happens when API access is abused. It applies to developers,
              integrations, enterprise customers, and anyone using programmatic access to FounderCentral.
            </p>
          </div>
        </header>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>1. What the API Provides Access To</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              The FounderCentral API may provide programmatic access to selected platform functions such as account or
              workspace integrations, profile management, listings, messaging workflows, analytics relevant to approved
              use cases, AI-enabled features, event-related data, and operational endpoints needed to support customer
              integrations.
            </p>
            <p>
              API availability may differ by account type, product plan, integration approval status, and technical
              readiness. Access to specific endpoints, schemas, and environments may change over time.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <TerminalSquare className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>2. Permitted Uses</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>Permitted uses of the FounderCentral API include legitimate, authorized activities such as:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Building approved internal tools, dashboards, workflows, or automations that support lawful use of FounderCentral.</li>
              <li>Integrating FounderCentral with customer CRM systems, analytics workflows, portfolio management tools, or other business systems where permitted.</li>
              <li>Supporting developer testing, product experimentation, or operational integrations in accordance with documented API rules and access levels.</li>
              <li>Using the API in ways that respect user consent, platform permissions, contractual restrictions, and applicable privacy and data protection laws.</li>
            </ul>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>3. Prohibited Uses</h2>
          </div>
          <div style={bodyStyle} className="space-y-4">
            <p>You may not use the FounderCentral API to engage in abuse, misuse, or circumvention of the platform. Prohibited activity includes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Scraping, harvesting, indexing, or extracting investor, founder, or platform data beyond what is expressly authorized.</li>
              <li>Automated mass messaging, bulk solicitation, spam campaigns, phishing, or outreach designed to imitate legitimate user behavior at scale.</li>
              <li>Reverse engineering the platform, probing internal systems, inferring undocumented endpoints, or attempting to reconstruct non-public business logic.</li>
              <li>Using the API to bypass rate limits, quotas, authentication requirements, feature restrictions, or access controls.</li>
              <li>Sharing access with unauthorized parties, creating synthetic traffic, or using rotating keys, proxy networks, or parallel accounts to evade enforcement.</li>
              <li>Using the API for unlawful surveillance, competitive data replication, fraud, harassment, securities abuse, or any other illegal or harmful conduct.</li>
            </ul>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Gauge className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>4. Rate Limits and Quotas</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              FounderCentral applies rate limits, concurrency controls, request thresholds, and quota rules to protect
              service stability, security, fairness, and platform performance. Limits may be enforced per API key, per
              user, per workspace, per IP address, per endpoint, or through a combination of these controls.
            </p>
            <p>
              Published or contract-based limits may vary by environment and plan. We may adjust limits at any time to
              address abuse, service reliability, or product changes. Clients are responsible for implementing retry
              logic, backoff strategies, and error handling appropriate to the API responses they receive.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <KeyRound className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>5. API Key Responsibilities</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              API keys, tokens, and other credentials must be kept confidential and stored securely. You are
              responsible for all activity performed with your credentials, including requests made by your employees,
              contractors, vendors, scripts, or integrated systems.
            </p>
            <p>
              You may not publicly expose, embed insecurely, share, resell, or transfer API credentials except as
              expressly permitted by FounderCentral. If you suspect a credential has been compromised, you must rotate
              it immediately and notify us without undue delay.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <TriangleAlert className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>6. Consequences of Abuse</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              If FounderCentral reasonably believes API access is being misused or abused, we may investigate, log
              evidence, throttle traffic, suspend requests, revoke API keys, restrict endpoint access, suspend or
              terminate associated accounts, and take any other action reasonably necessary to protect the platform and
              its users.
            </p>
            <p>
              Serious violations may also result in contractual remedies, legal claims, regulatory reporting, or law
              enforcement referral where appropriate. Enforcement decisions may be made with or without prior notice
              where urgent action is necessary.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>7. Reporting API Abuse</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              If you believe someone is misusing the FounderCentral API, including scraping data, abusing messaging
              workflows, or attempting to evade controls, report the issue to FounderCentral as soon as possible.
            </p>
            <p>
              Reports should include relevant timestamps, affected endpoints or features, account or key identifiers if
              known, and any logs or evidence that may help us investigate.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>8. Requesting Higher Limits</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              If you need higher rate limits, larger quotas, or broader API access for a legitimate business purpose,
              you may request a review from FounderCentral. Requests should explain the use case, projected volume,
              security controls, and why existing limits are insufficient.
            </p>
            <p>
              FounderCentral may grant higher limits for approved enterprise integrations, tested production
              deployments, or other legitimate cases, subject to contract terms, technical review, and continued good
              standing.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>9. Contact Information</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              For API access, integration review, abuse reports, or rate limit requests, contact:
            </p>
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--muted)' }}
            >
              <p><strong>FounderCentral API Team</strong></p>
              <p>Email: api@foundercentral.in</p>
              <p>Security: security@foundercentral.in</p>
              <p>Support: support@foundercentral.in</p>
              <p>Website: https://foundercentral.in</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
