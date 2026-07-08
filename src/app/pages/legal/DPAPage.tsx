import { Link } from 'react-router-dom'
import { SEO } from '@/app/components/SEO'
import { ArrowLeft, DatabaseZap, Globe, Lock, Mail, ScrollText, ShieldCheck, UserCog } from 'lucide-react'

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

export function DPAPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-2)' }}>
      <SEO
        title="Data Processing Agreement"
        description="GDPR-compliant Data Processing Agreement for FounderCentral users, partners, and integration providers."
        path="/dpa"
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
              <ScrollText className="w-7 h-7" />
            </div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: 'var(--surface)' }}>
              Data Processing Agreement
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.7, fontSize: '1rem' }}>
              This Data Processing Agreement describes how FounderCentral processes personal data on behalf of
              enterprise customers and professional users who act as controllers under applicable data protection law.
              It is intended to support GDPR-compliant use of the platform when customer data is processed through our
              founder, investor, networking, matching, analytics, and support workflows.
            </p>
          </div>
        </header>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>1. Introduction and Purpose</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              This Data Processing Agreement, or DPA, forms part of the agreement between FounderCentral and the
              customer, client, or organization that uses FounderCentral to upload, store, manage, review, or analyze
              personal data. Its purpose is to define the parties&apos; rights and responsibilities where FounderCentral
              acts as a processor or sub-processor on behalf of a controller.
            </p>
            <p>
              This DPA applies when personal data subject to the GDPR, UK GDPR, Swiss data protection law, or similar
              privacy regimes is processed through FounderCentral. To the extent FounderCentral determines the
              purposes and means of processing for its own account, it acts as an independent controller and its Privacy
              Policy continues to apply to that activity.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <DatabaseZap className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>2. Definitions</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>For purposes of this DPA:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Controller</strong> means the entity that determines the purposes and means of processing personal data.</li>
              <li><strong>Processor</strong> means the entity that processes personal data on behalf of the controller.</li>
              <li><strong>Personal Data</strong> means any information relating to an identified or identifiable natural person.</li>
              <li><strong>Processing</strong> means any operation performed on personal data, including collection, storage, use, disclosure, analysis, deletion, or destruction.</li>
              <li><strong>Data Subject</strong> means the individual to whom the personal data relates.</li>
              <li><strong>Sub-processor</strong> means a third party engaged by FounderCentral to process personal data on its behalf.</li>
              <li><strong>Applicable Data Protection Law</strong> means the GDPR, UK GDPR, Swiss FADP, and other laws governing the processing of personal data relevant to the services.</li>
            </ul>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>3. Scope of Data Processing</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              FounderCentral processes personal data only as needed to deliver the services requested by the customer.
              This may include account administration, profile hosting, investor and founder discovery, onboarding
              workflows, contact and communication records, AI-assisted summaries, analytics relevant to the service,
              support operations, and secure storage of related uploaded materials.
            </p>
            <p>
              The categories of data may include names, email addresses, professional biographies, company and fund
              information, team details, profile metadata, uploaded files, usage logs, support records, and other data
              submitted by or on behalf of the controller. Processing is limited to the duration of the applicable
              service relationship and subject to the controller&apos;s documented instructions, unless otherwise required by
              law.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>4. FounderCentral Obligations as Processor</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>When acting as a processor, FounderCentral will:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Process personal data only on documented instructions from the controller, unless required to do otherwise by applicable law.</li>
              <li>Ensure that personnel authorized to process personal data are subject to confidentiality obligations.</li>
              <li>Implement appropriate technical and organizational measures to protect personal data against unauthorized access, loss, misuse, alteration, or disclosure.</li>
              <li>Assist the controller, taking into account the nature of processing, with responding to data subject requests and meeting regulatory obligations where reasonably possible.</li>
              <li>Make available information reasonably necessary to demonstrate compliance with this DPA.</li>
              <li>Notify the controller of legally binding requests for disclosure unless prohibited by law.</li>
            </ul>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <UserCog className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>5. Controller Obligations</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>The customer or enterprise client, acting as controller, is responsible for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Providing lawful instructions and ensuring it has a valid legal basis for the personal data it submits to FounderCentral.</li>
              <li>Complying with transparency, consent, notice, and other obligations owed to data subjects.</li>
              <li>Ensuring data supplied to the platform is accurate, relevant, and limited to what is necessary for the intended processing.</li>
              <li>Responding to data subject requests and regulatory inquiries, except to the extent processor assistance is required under law.</li>
              <li>Not using the service to process prohibited categories of data unless separately agreed and appropriately safeguarded.</li>
            </ul>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>6. Data Security Measures</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              FounderCentral maintains technical and organizational measures designed to protect personal data
              appropriate to the risk presented by the processing. These measures include role-based access controls,
              authenticated access to production systems, encryption in transit, infrastructure logging, secure storage
              practices, environment separation, incident response procedures, and controls to reduce unauthorized
              disclosure, alteration, or loss.
            </p>
            <p>
              Security measures evolve over time to reflect changes in technology, threat landscape, and service design.
              No security measure can guarantee absolute security, but FounderCentral will maintain safeguards that are
              reasonable and proportionate for the services provided.
            </p>
            <p>
              Enterprise customers looking for a higher-level summary of our current control posture and audit
              preparation can review our{' '}
              <Link to="/soc2-readiness" className="font-medium underline underline-offset-2" style={{ color: 'var(--blue)' }}>
                SOC 2 Readiness
              </Link>
              {' '}page.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>7. Sub-processors</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              FounderCentral may use carefully selected sub-processors to support the delivery of the platform. Current
              core sub-processors include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase</strong> for authentication, managed database services, file storage, and related backend infrastructure.</li>
              <li><strong>Hostinger</strong> for application hosting, deployment, and server infrastructure.</li>
            </ul>
            <p>
              FounderCentral remains responsible for the performance of its sub-processors to the extent required by
              applicable law and contract. New sub-processors may be added as the service evolves, subject to
              appropriate diligence and contractual safeguards.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>8. Data Retention and Deletion</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              FounderCentral retains personal data only for as long as necessary to provide the services, comply with
              lawful instructions, maintain security and backup processes, resolve disputes, and satisfy legal
              obligations. Retention periods may differ depending on data type, service configuration, and legal
              requirements.
            </p>
            <p>
              Upon termination of the relevant service relationship and subject to applicable law, FounderCentral will
              delete or return controller personal data within a commercially reasonable period, unless retention is
              required by law or necessary for limited security, fraud prevention, or backup restoration purposes.
            </p>
            <p>
              Additional details about category-specific retention periods, AI prompt storage, deletion handling, and
              governance responsibilities are available in our{' '}
              <Link to="/data-governance" className="font-medium underline underline-offset-2" style={{ color: 'var(--blue)' }}>
                Data Governance Policy
              </Link>
              .
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>9. Data Breach Notification</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              If FounderCentral becomes aware of a confirmed personal data breach affecting controller data, it will
              notify the controller without undue delay after becoming aware of the incident. Notification will include,
              to the extent available, the nature of the breach, the categories of data involved, likely consequences,
              and measures taken or proposed to address the incident.
            </p>
            <p>
              FounderCentral will cooperate reasonably with the controller in connection with breach investigation,
              containment, remediation, and legally required notifications, taking into account the nature of processing
              and the information available to FounderCentral.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>10. International Data Transfers</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              Where personal data subject to the GDPR or similar law is transferred outside the European Economic Area,
              United Kingdom, or Switzerland, FounderCentral will implement appropriate transfer safeguards as required
              by applicable law. These safeguards may include standard contractual clauses, equivalent contractual
              protections, adequacy decisions, or other lawful transfer mechanisms made available through Capital
              Connect and its sub-processors.
            </p>
            <p>
              FounderCentral will assess transfer arrangements on an ongoing basis and take commercially reasonable
              steps to address material changes affecting the lawfulness of those transfers.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>11. Contact Details</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              For DPA requests, controller instructions, sub-processor inquiries, or other data protection matters,
              contact:
            </p>
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--muted)' }}
            >
              <p><strong>FounderCentral Data Protection Team</strong></p>
              <p>Email: privacy@foundercentral.in</p>
              <p>Legal: legal@foundercentral.in</p>
              <p>Support: support@foundercentral.in</p>
              <p>Website: https://foundercentral.in</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
