import { Link } from 'react-router-dom'
import { SEO } from '@/app/components/SEO'
import { ArrowLeft, BadgeCheck, DatabaseZap, Lock, Mail, ShieldCheck, TimerReset, Users } from 'lucide-react'

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

export function SOC2ReadinessPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-2)' }}>
      <SEO
        title="SOC 2 Readiness"
        description="FounderCentral's security posture and progress toward SOC 2 Type II compliance. Controls in place, what's still in progress."
        path="/soc2-readiness"
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
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: 'var(--surface)' }}>
              SOC 2 Readiness
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.7, fontSize: '1rem' }}>
              FounderCentral is preparing its security, availability, confidentiality, processing integrity, and
              privacy program to support enterprise due diligence and progression toward SOC 2 Type II certification.
              This page summarizes the controls and readiness work currently in place for customers evaluating the
              platform.
            </p>
          </div>
        </header>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>1. What SOC 2 Is and Why It Matters</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              SOC 2 is an attestation framework developed by the AICPA for evaluating how service organizations design
              and operate controls relevant to security, availability, confidentiality, processing integrity, and
              privacy. Enterprise customers commonly use SOC 2 reviews to assess whether a vendor can responsibly
              protect data and operate critical systems in a controlled manner.
            </p>
            <p>
              For FounderCentral, SOC 2 readiness supports customer trust, procurement reviews, security
              questionnaires, and the structured collection of evidence needed for a formal audit.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <BadgeCheck className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>2. Trust Service Criteria Addressed</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Security (CC6):</strong> access controls, verified authentication, transport protections, monitoring, and abuse prevention.</li>
              <li><strong>Availability (A1):</strong> hosted delivery through managed infrastructure, incident response logging, and operational monitoring.</li>
              <li><strong>Confidentiality (C1):</strong> data handling restrictions, environment-variable controls, limited credential exposure, and NDA-backed operational expectations for staff and vendors.</li>
              <li><strong>Processing Integrity (PI1):</strong> input validation, sanitization, schema enforcement, and controls intended to support accurate and complete processing.</li>
              <li><strong>Privacy (P1-P8):</strong> published privacy, GDPR, DPA, data governance, and AI transparency documentation governing personal data handling.</li>
            </ul>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>3. Current Security Controls</h2>
          </div>
          <div style={bodyStyle} className="space-y-4">
            <p>FounderCentral currently operates with the following controls reflected in the codebase and deployment guidance:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Authentication and access management:</strong> Supabase Auth with verified-email sign-in, strong password policy guidance, PKCE auth flow, session inactivity handling, and browser storage restricted to `sessionStorage` rather than `localStorage` for auth tokens.</li>
              <li><strong>Encryption in transit and at rest:</strong> deployment requires HTTPS, HSTS, mixed-content blocking, and managed backend infrastructure through Supabase for encrypted transport and platform-managed storage protections.</li>
              <li><strong>Rate limiting and abuse protection:</strong> server-side rate limiting through Supabase Edge Functions, plus client-side throttling for auth flows and per-IP/per-user AI throttling.</li>
              <li><strong>Input validation and sanitization:</strong> centralized sanitization utilities validate text, URLs, dates, filenames, arrays, and uploaded files, with Zod-backed schemas for API inputs.</li>
              <li><strong>Audit logging and monitoring:</strong> frontend security events, auth failures, and API failures are logged through the admin audit system and Supabase logs.</li>
            </ul>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>4. What Enterprise Clients Can Expect</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <ul className="list-disc pl-6 space-y-2">
              <li>Reasonable support for enterprise security questionnaires during vendor review.</li>
              <li>Penetration test summary material or report availability on request, subject to scope, timing, and confidentiality restrictions.</li>
              <li>Availability of data protection terms, including our{' '}
                <Link to="/dpa" className="font-medium underline underline-offset-2" style={{ color: 'var(--blue)' }}>
                  Data Processing Agreement
                </Link>
                , for enterprise customers processing regulated data.</li>
              <li>Documentation of privacy, GDPR, AI transparency, data governance, and API abuse policies to support procurement and security review workflows.</li>
            </ul>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <TimerReset className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>5. Roadmap to SOC 2 Type II</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>FounderCentral&apos;s current readiness roadmap includes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Completing centralized evidence collection for authentication, logging, access control, infrastructure, and incident handling.</li>
              <li>Formalizing policy review cadence, control ownership, onboarding/offboarding records, and change-management evidence.</li>
              <li>Validating deployment configuration across Supabase and server infrastructure, including provider-side rate limits, RLS enforcement, and log review procedures.</li>
              <li>Performing internal control walkthroughs, remediating identified gaps, and engaging an auditor for readiness assessment followed by a Type II observation window.</li>
            </ul>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <DatabaseZap className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>6. Enterprise Security Contact</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              For enterprise security reviews, questionnaires, DPA requests, or SOC 2 readiness discussions, contact:
            </p>
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--muted)' }}
            >
              <p><strong>FounderCentral Security Team</strong></p>
              <p>Email: security@foundercentral.in</p>
              <p>Privacy: privacy@foundercentral.in</p>
              <p>Support: support@foundercentral.in</p>
              <p>Website: https://foundercentral.in</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
