import { Link } from 'react-router-dom'
import { SEO } from '@/app/components/SEO'
import { ArrowLeft, Database, Eye, FileClock, Mail, ShieldCheck, Trash2, UserRoundCog } from 'lucide-react'

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

export function DataGovernancePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-2)' }}>
      <SEO
        title="Data Governance"
        description="How FounderCentral handles data classification, retention, access control, and lifecycle across all systems."
        path="/data-governance"
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
              <Database className="w-7 h-7" />
            </div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: 'var(--surface)' }}>
              Data Governance Policy
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.7, fontSize: '1rem' }}>
              This Data Governance Policy explains how FounderCentral manages retention, deletion, access, accuracy,
              oversight, and lifecycle controls for platform data. It is intended to give users, customers, and
              partners a clear view of how information is handled across account, profile, analytics, AI, and support
              workflows.
            </p>
          </div>
        </header>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <FileClock className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>1. Data Retention Timelines</h2>
          </div>
          <div style={bodyStyle} className="space-y-4">
            <p>FounderCentral applies retention periods based on the category of data, the service relationship, and legal or security requirements.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account data:</strong> retained while the account remains active and typically for up to 24 months afterward where needed for compliance, dispute resolution, fraud prevention, and backup restoration.</li>
              <li><strong>Profile data:</strong> founder and investor profile information is retained while the profile is active and commonly for up to 12 months after deactivation unless deletion is requested earlier or longer retention is legally required.</li>
              <li><strong>Usage logs and analytics data:</strong> retained for operational, security, and product-improvement purposes, commonly for 12 months, with some aggregated or de-identified analytics retained longer.</li>
              <li><strong>AI chat history and outputs:</strong> prompts, responses, and related metadata may be retained for up to 12 months for safety review, debugging, abuse detection, product quality, and continuity of user experience, unless shorter retention applies in a specific workflow.</li>
              <li><strong>Support and feedback data:</strong> support requests, bug reports, and user feedback may be retained for up to 24 months or longer where needed to resolve ongoing issues, document compliance, or defend legal claims.</li>
            </ul>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>2. Data Deletion Policy</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              Users may request deletion of account, profile, or other personal data by using in-product controls where
              available or by contacting FounderCentral using the details below. We may need to verify identity before
              processing a deletion request to protect account security and prevent unauthorized removal of data.
            </p>
            <p>
              Once a validated request is received, FounderCentral aims to complete deletion or de-identification
              within 30 days, subject to legal obligations, fraud prevention needs, backup cycles, and technical limits.
              Some residual data may remain temporarily in backups or archived security logs until normal rotation
              schedules complete.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>3. Prompt and Output Storage Policy</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              FounderCentral may store AI prompts, AI-generated outputs, and related usage metadata when users engage
              with AI-assisted platform features. Stored elements may include prompt text, generated responses, timing
              information, user or workspace context necessary to support the feature, and operational logs associated
              with the interaction.
            </p>
            <p>
              This information is retained only as long as necessary for security monitoring, debugging, abuse
              detection, feature continuity, and product quality improvement. Unless a longer period is required for an
              active investigation or legal obligation, AI prompt and output records are typically retained for up to 12
              months and then deleted, anonymized, or aggregated where feasible.
            </p>
            <p>
              Additional detail about what prompt content is stored, what should not be submitted, deletion handling,
              and opt-out expectations is available in our{' '}
              <Link to="/prompt-storage-policy" className="font-medium underline underline-offset-2" style={{ color: 'var(--blue)' }}>
                Prompt and Output Storage Policy
              </Link>
              .
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>4. Data Quality and Accuracy Responsibilities</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              Users are responsible for ensuring that the information they submit to FounderCentral is accurate,
              current, and not misleading, particularly for account details, founder and investor profiles, fundraising
              data, portfolio information, and business contact details.
            </p>
            <p>
              FounderCentral is responsible for maintaining reasonable controls that support data integrity in platform
              systems, including access controls, update workflows, logging, and mechanisms for correcting or deleting
              inaccurate records when brought to our attention. Enterprise customers acting as controllers remain
              responsible for the lawfulness and quality of data they provide to the platform.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <UserRoundCog className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>5. Governance Responsibilities</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              Data governance at FounderCentral is managed by cross-functional owners that may include privacy,
              security, legal, engineering, and operations personnel. These teams are responsible for retention
              decisions, deletion workflows, access management, incident handling, compliance review, and updates to
              relevant data handling policies.
            </p>
            <p>
              Day-to-day operational responsibility for data governance requests is handled through the FounderCentral
              Privacy Team and related internal stakeholders who coordinate responses to access, correction, export, and
              deletion requests.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>6. Access, Correction, and Export Requests</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              Users may access and update some data directly within the product, including portions of their account and
              profile information. For requests that cannot be completed in-product, users may contact FounderCentral
              to request access to stored personal data, correction of inaccurate records, or export of data where
              applicable law provides that right.
            </p>
            <p>
              We may require identity verification before fulfilling a request. Requests are reviewed and handled within
              the timeframe required by applicable law, and in many cases within 30 days of receipt of a verifiable
              request.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>7. Policy Review and Update Schedule</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              FounderCentral reviews this Data Governance Policy on a regular basis and typically at least annually, or
              sooner when there are material changes to platform architecture, product features, legal requirements,
              retention practices, AI workflows, or third-party service providers.
            </p>
            <p>
              When updates are made, the effective date will be revised and additional notice may be provided through
              the platform or by other reasonable means where appropriate.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>8. Contact Information</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              For data retention, deletion, access, correction, export, or governance-related inquiries, contact:
            </p>
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--muted)' }}
            >
              <p><strong>FounderCentral Privacy Team</strong></p>
              <p>Email: privacy@foundercentral.in</p>
              <p>Support: support@foundercentral.in</p>
              <p>Legal: legal@foundercentral.in</p>
              <p>Website: https://foundercentral.in</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
