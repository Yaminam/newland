import { Link } from 'react-router-dom'
import { SEO } from '@/app/components/SEO'
import {
  ArrowLeft,
  BadgeCheck,
  Brain,
  Gavel,
  Mail,
  OctagonAlert,
  Scale,
  Shield,
  UserCheck,
} from 'lucide-react'

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

export function TermsOfServicePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-2)' }}>
      <SEO
        title="Terms of Service"
        description="The terms of using FounderCentral, the platform connecting founders with verified investors via warm introductions."
        path="/terms-of-service"
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
              <Scale className="w-7 h-7" />
            </div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: 'var(--surface)' }}>
              Terms of Service
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.7, fontSize: '1rem' }}>
              These Terms of Service govern your access to and use of FounderCentral, a platform that connects
              founders and investors through profile creation, discovery, AI-assisted workflows, communication tools,
              and related services. By using the platform, you agree to these terms and to use the service in a lawful,
              professional, and accurate manner.
            </p>
          </div>
        </header>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>1. Acceptance of Terms</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              By accessing or using FounderCentral, you agree to be bound by these Terms of Service and any additional
              policies or guidelines we publish for the platform. If you use the service on behalf of a company, fund,
              startup, or other organization, you represent that you have authority to bind that entity to these terms.
            </p>
            <p>
              If you do not agree to these terms, you must not access or use FounderCentral. Your continued use of the
              platform after updates become effective constitutes acceptance of the revised terms.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <BadgeCheck className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>2. Platform and Services</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              FounderCentral is designed to help founders and investors discover one another, maintain profiles,
              evaluate opportunities, manage introductions, and use digital tools that support fundraising and investor discovery
              workflows. Features may include onboarding questionnaires, searchable profile listings, matching logic,
              AI-assisted summaries and recommendations, dashboards, messaging or introduction flows, events, analytics,
              and document or media uploads.
            </p>
            <p>
              We may add, remove, suspend, or change features at any time. We do not guarantee that any specific
              feature, matching outcome, introduction, investor interest, fundraising result, or business outcome will
              be available or achieved through the platform.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>3. AI-Generated Content Disclaimer</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              FounderCentral may provide AI-generated or AI-assisted content, including summaries, rankings,
              recommendations, insights, prompts, messaging assistance, or analysis. These outputs are generated by
              automated systems and may be inaccurate, incomplete, biased, delayed, or inappropriate for your specific
              circumstances.
            </p>
            <p>
              AI-generated outputs are provided for general informational and workflow support purposes only. They are
              not financial advice, investment advice, legal advice, tax advice, accounting advice, brokerage services,
              due diligence conclusions, or regulatory guidance. You are solely responsible for reviewing and validating
              any output before relying on it for fundraising, investing, legal, tax, employment, or compliance
              decisions.
            </p>
            <p>
              Additional information about our AI-assisted features, data handling, and review practices is available in
              our{' '}
              <Link to="/ai-transparency" className="font-medium underline underline-offset-2" style={{ color: 'var(--blue)' }}>
                AI Transparency Statement
              </Link>
              .
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <OctagonAlert className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>4. Acceptable Use Policy</h2>
          </div>
          <div style={bodyStyle} className="space-y-4">
            <p>You agree not to misuse FounderCentral or help others do so. Prohibited conduct includes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Creating fake, misleading, impersonated, or deceptive founder, investor, advisor, or company profiles.</li>
              <li>Submitting false fundraising metrics, portfolio claims, credentials, ownership information, or contact details.</li>
              <li>Sending spam, mass unsolicited outreach, repetitive promotions, phishing messages, or fraudulent solicitations.</li>
              <li>Using the platform to scrape data, harvest emails, build competing datasets, or conduct unauthorized surveillance.</li>
              <li>Uploading malicious code, malware, harmful scripts, corrupted files, or content intended to disrupt the service.</li>
              <li>Attempting to bypass security controls, access non-public areas, probe vulnerabilities, or interfere with platform integrity.</li>
              <li>Using the service for unlawful securities activity, market manipulation, fraud, money laundering, harassment, discrimination, or other illegal conduct.</li>
              <li>Posting infringing, defamatory, obscene, hateful, abusive, or otherwise unlawful content.</li>
            </ul>
            <p>
              We may investigate suspected violations, remove content, restrict access, preserve evidence, and report
              conduct to relevant authorities where appropriate.
            </p>
            <p>
              If you access FounderCentral through developer tooling or programmatic integrations, additional rules
              apply under our{' '}
              <Link to="/api-usage-policy" className="font-medium underline underline-offset-2" style={{ color: 'var(--blue)' }}>
                API Usage &amp; Abuse Policy
              </Link>
              .
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>5. User Responsibilities</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              You are responsible for the content you submit, the accuracy of your account and profile information, and
              the actions taken through your account. Information you provide about your company, fund, fundraising
              status, investment thesis, team, traction, portfolio, and contact details must be truthful, current, and
              not misleading.
            </p>
            <p>
              You are also responsible for maintaining the confidentiality of your login credentials and for all
              activity that occurs under your account. You must promptly notify FounderCentral if you suspect
              unauthorized use, a security incident, or compromise of your account.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>6. Intellectual Property Rights</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              FounderCentral and its related software, branding, user interface, visual design, text, logos,
              compilations, and platform functionality are owned by us or our licensors and are protected by applicable
              intellectual property laws. Except as expressly allowed by these terms, you may not copy, modify,
              distribute, reverse engineer, republish, or create derivative works from the platform.
            </p>
            <p>
              You retain ownership of content you submit, upload, or post to the platform, subject to any rights needed
              for us to operate the service. By submitting content, you grant us a non-exclusive, worldwide license to
              host, store, process, display, reproduce, and use that content as necessary to provide, secure, improve,
              and administer FounderCentral.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>7. Account Suspension and Termination</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              We may suspend, restrict, or terminate your account, remove content, or disable access to all or part of
              the platform if we believe you have violated these terms, created legal or security risk, engaged in
              fraudulent or abusive behavior, failed verification checks, or used the platform in a way that harms
              other users or FounderCentral.
            </p>
            <p>
              You may stop using the platform at any time and may request account closure by contacting us. Termination
              does not relieve you of obligations accrued before termination, including obligations relating to content,
              misuse, payment if applicable, or legal compliance.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Gavel className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>8. Limitation of Liability</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              FounderCentral is provided on an &quot;as is&quot; and &quot;as available&quot; basis. To the maximum extent permitted
              by law, we disclaim all warranties, whether express, implied, or statutory, including implied warranties
              of merchantability, fitness for a particular purpose, non-infringement, and uninterrupted availability.
            </p>
            <p>
              To the fullest extent permitted by law, FounderCentral and its affiliates, officers, employees,
              contractors, and licensors will not be liable for any indirect, incidental, consequential, special,
              exemplary, or punitive damages, or for any loss of profits, revenue, goodwill, business opportunities,
              data, investments, or anticipated fundraising results arising out of or related to your use of the
              platform, even if we were advised of the possibility of such damages.
            </p>
            <p>
              Where liability cannot be excluded, our aggregate liability for claims arising from the service will be
              limited to the greater of the amount you paid us, if any, for the applicable service during the 12 months
              before the claim arose, or one hundred U.S. dollars (USD $100).
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>9. Changes to These Terms</h2>
          <p style={bodyStyle}>
            We may revise these Terms of Service from time to time to reflect product, legal, or operational changes.
            When we do, we will update the effective date above and may provide additional notice through the platform
            or by email where appropriate. You should review the terms periodically. Continued use of FounderCentral
            after updated terms take effect means you accept the revised terms.
          </p>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>10. Governing Law</h2>
          <p style={bodyStyle}>
            These terms and any dispute, claim, or controversy arising out of or relating to FounderCentral will be
            governed by and construed in accordance with the laws of the State of Delaware, United States, without
            regard to conflict of law principles. You agree that the state or federal courts located in Delaware will
            have exclusive jurisdiction over disputes arising from or related to these terms or the platform, except to
            the extent applicable law requires otherwise.
          </p>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>11. Contact Information</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              Questions about these terms, account status, platform use restrictions, or legal notices can be sent to:
            </p>
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--muted)' }}
            >
              <p><strong>FounderCentral Legal Team</strong></p>
              <p>Email: legal@foundercentral.in</p>
              <p>Support: support@foundercentral.in</p>
              <p>Website: https://foundercentral.in</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
