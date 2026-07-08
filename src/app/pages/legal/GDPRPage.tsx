import { Link } from 'react-router-dom'
import { SEO } from '@/app/components/SEO'
import { ArrowLeft, FileLock2, Globe, Mail, Scale, ShieldCheck, UserRoundSearch } from 'lucide-react'
import { GDPRDataRequestForm } from '../../components/GDPRDataRequestForm'

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

export function GDPRPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-2)' }}>
      <SEO
        title="GDPR Compliance"
        description="How FounderCentral complies with the EU General Data Protection Regulation. Your data rights, our obligations."
        path="/gdpr"
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
              GDPR Compliance
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.7, fontSize: '1rem' }}>
              This page explains how FounderCentral approaches GDPR compliance for users in the European Economic Area,
              the United Kingdom, and Switzerland, including what data we collect, our legal bases for processing, your
              rights, and how to exercise them.
            </p>
          </div>
        </header>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>1. What GDPR Is and Who It Applies To</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              The General Data Protection Regulation, or GDPR, is a European privacy law that governs how personal data
              is collected, used, stored, transferred, and protected. It applies to organizations that process personal
              data of individuals located in the European Economic Area and, in similar form, to related privacy
              frameworks such as the UK GDPR and Swiss data protection rules.
            </p>
            <p>
              FounderCentral applies these standards to EU, UK, and Swiss users when providing the platform and
              related services.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <UserRoundSearch className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>2. Personal Data We Collect From EU Users</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>Depending on how you use the platform, FounderCentral may collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account data such as name, email address, role, authentication state, and account preferences.</li>
              <li>Founder and investor profile data such as company, fund, sector, stage, geography, biography, website, LinkedIn, target raise, or investment criteria.</li>
              <li>Content you submit such as onboarding answers, messaging content, introduction requests, uploaded files, AI prompts, and AI outputs.</li>
              <li>Usage and security data such as log events, timestamps, device or browser details, and IP-derived security telemetry.</li>
              <li>Support, feedback, and compliance records when you contact us about the service.</li>
            </ul>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <FileLock2 className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>3. Legal Bases for Processing</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>FounderCentral relies on one or more of the following legal bases, depending on the activity:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Contract:</strong> to create and maintain your account, deliver platform functionality, and provide requested services.</li>
              <li><strong>Legitimate interests:</strong> to secure the platform, prevent abuse, improve product quality, operate matching and discovery workflows, and manage support or analytics relevant to the service.</li>
              <li><strong>Consent:</strong> where required for optional cookies, specific communications, or other processing that depends on user permission.</li>
              <li><strong>Legal obligation:</strong> where retention, disclosure, or investigation is required by law or regulatory process.</li>
            </ul>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>4. EU User Rights</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>Subject to applicable law, EU users may have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Right to access:</strong> request confirmation of whether we process your personal data and obtain a copy of relevant information.</li>
              <li><strong>Right to erasure:</strong> request deletion of your personal data where legal grounds for continued retention do not apply.</li>
              <li><strong>Right to data portability:</strong> request a portable copy of certain personal data in a structured format where required by law.</li>
              <li><strong>Right to rectification:</strong> request correction of inaccurate or incomplete data.</li>
              <li><strong>Right to object:</strong> object to processing based on legitimate interests in certain circumstances.</li>
              <li><strong>Right to restrict processing:</strong> request that we limit processing in specific cases while a concern is reviewed.</li>
            </ul>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>5. How to Exercise Your Rights</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              You can exercise GDPR rights by emailing FounderCentral or by submitting the request form below. We may
              need to verify your identity before processing a request to protect account security and prevent
              unauthorized disclosures.
            </p>
            <p>
              We aim to respond within the time required by applicable law, and in many cases within 30 days of
              receiving a verifiable request.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>6. Data Retention for EU Users</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              FounderCentral retains EU user data only for as long as necessary for the relevant service, security,
              legal, and operational purposes. Account and profile data are generally retained while the account is
              active and for a limited period afterward to support legal compliance, dispute resolution, fraud
              prevention, and backup recovery.
            </p>
            <p>
              Usage logs, support data, and AI-related records may be retained on category-specific schedules. For a
              more detailed breakdown of retention categories and deletion timing, review our{' '}
              <Link to="/data-governance" className="font-medium underline underline-offset-2" style={{ color: 'var(--blue)' }}>
                Data Governance Policy
              </Link>
              .
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>7. International Data Transfers and Safeguards</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              When EU user data is transferred outside the EEA, UK, or Switzerland, FounderCentral relies on
              appropriate safeguards where required by law. These may include standard contractual clauses, equivalent
              contractual protections, adequacy decisions, or other recognized transfer mechanisms supported by Capital
              Connect and its service providers.
            </p>
            <p>
              We review transfer arrangements on an ongoing basis and take reasonable steps to address material legal or
              operational changes affecting those transfers.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>8. Complaints to Supervisory Authorities</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              If you believe FounderCentral has not handled your personal data in compliance with GDPR or similar law,
              you may lodge a complaint with the supervisory authority in your country of residence, place of work, or
              the place of the alleged infringement.
            </p>
            <p>
              We encourage users to contact FounderCentral first so we can review and address the concern directly
              where possible.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>9. Data Protection Officer Contact</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              For GDPR rights requests, complaints, or data protection inquiries, contact:
            </p>
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--muted)' }}
            >
              <p><strong>FounderCentral Data Protection Officer</strong></p>
              <p>Email: dpo@foundercentral.in</p>
              <p>Privacy Team: privacy@foundercentral.in</p>
              <p>Support: support@foundercentral.in</p>
              <p>Website: https://foundercentral.in</p>
            </div>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>10. GDPR Data Request Form</h2>
          </div>
          <div style={bodyStyle} className="space-y-4">
            <p>
              Use this form to submit a data access, deletion, or export request. Submitting the form prepares an email
              to our privacy team with the details you provide.
            </p>
            <GDPRDataRequestForm />
          </div>
        </section>
      </div>
    </div>
  )
}
