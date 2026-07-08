import { Link } from 'react-router-dom'
import { SEO } from '@/app/components/SEO'
import { ShieldCheck, Database, Brain, Cookie, Globe, Mail, ArrowLeft } from 'lucide-react'

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

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-2)' }}>
      <SEO
        title="Privacy Policy"
        description="How FounderCentral collects, uses, and protects your data. GDPR and India DPDP Act 2023 compliant."
        path="/privacy-policy"
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
              Privacy Policy
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.7, fontSize: '1rem' }}>
              FounderCentral is a platform that connects founders and investors. This Privacy Policy explains what
              personal data we collect, how we use it, when we share it, how long we keep it, and the rights you have
              over your information when you use our website, applications, onboarding flows, matching tools, AI
              features, investor discovery tools, founder discovery tools, analytics, and related services.
            </p>
          </div>
        </header>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>1. Scope and Roles</h2>
          <p style={bodyStyle}>
            FounderCentral acts as the controller of personal data described in this policy for platform account
            management, networking, matching, security, and service improvement. In practical terms, this means we
            decide how account, profile, and usage information is processed for the operation of the platform. This
            policy applies to founders, investors, prospective users, event participants, people who contact us, and
            visitors who browse public pages.
          </p>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>2. Data We Collect</h2>
          </div>
          <div style={bodyStyle} className="space-y-4">
            <p>We collect the following categories of information, depending on how you use FounderCentral:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account data such as name, email address, password credential data handled through our authentication provider, account role, and verification state.</li>
              <li>Profile data such as company name, investor type, founder type, fund information, startup information, biography, sector focus, stage focus, geography preferences, LinkedIn URL, website URL, target raise, traction details, pitch information, support needs, and similar onboarding or listing information.</li>
              <li>Content you submit such as notes, portfolio entries, event responses, introduction requests, AI prompts, AI chat context, and messages sent through platform workflows.</li>
              <li>Uploaded files such as avatars, pitch decks, and other files you choose to upload to profile or listing surfaces.</li>
              <li>Usage data such as pages viewed, actions taken, approximate timestamps, device and browser metadata, IP-derived security telemetry, and operational logs used for abuse prevention and troubleshooting.</li>
              <li>Cookie and local-storage data used to keep you signed in, preserve settings, remember preferences, support analytics, and maintain security controls.</li>
              <li>Support and contact data such as emails or requests you send to us about the service, privacy, security, or account issues.</li>
            </ul>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>3. How We Use Personal Data</h2>
          <div style={bodyStyle}>
            <p className="mb-3">We use personal data to operate and improve FounderCentral, including to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Create and maintain user accounts, authenticate logins, confirm email ownership, and secure sessions.</li>
              <li>Match founders with investors based on profile information, stated preferences, traction signals, stage, sector, geography, and platform interactions.</li>
              <li>Power search, discovery, dashboards, portfolio tracking, introduction workflows, and event participation.</li>
              <li>Improve product quality, develop new features, diagnose errors, monitor abuse, and understand how users interact with the service.</li>
              <li>Communicate with you about verification, account activity, onboarding, introductions, product updates, support issues, compliance matters, and security notices.</li>
              <li>Enforce platform rules, investigate suspicious behavior, comply with legal obligations, and protect the rights, safety, and integrity of users and the platform.</li>
            </ul>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>4. AI Data Processing</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              FounderCentral includes AI-assisted features such as matching support, market intelligence, and other
              workflow assistance. When you use these features, prompts, profile context, and other relevant service
              data may be processed to generate a response, recommendation, summary, or ranking.
            </p>
            <p>
              We design AI processing to support platform functionality and internal service quality. We do not intend
              for users to submit highly sensitive personal data, banking credentials, government identifiers, or
              special-category data through AI prompts. You should avoid entering information that is not necessary for
              the requested result.
            </p>
            <p>
              AI outputs can be probabilistic. They may be inaccurate, incomplete, or outdated and should be reviewed by
              the user before being relied on for investment, fundraising, legal, tax, employment, or regulatory
              decisions. AI interactions may be logged for security, abuse monitoring, debugging, and product
              improvement subject to this policy and applicable law.
            </p>
            <p>
              For a more detailed explanation of our AI-assisted features, model usage, human oversight, and quality
              controls, review our{' '}
              <Link to="/ai-transparency" className="font-medium underline underline-offset-2" style={{ color: 'var(--blue)' }}>
                AI Transparency Statement
              </Link>
              .
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>5. Cookies and Similar Technologies</h2>
          <div className="flex items-start gap-3">
            <Cookie className="w-5 h-5 mt-1 shrink-0" style={{ color: 'var(--blue)' }} />
            <div style={bodyStyle} className="space-y-3">
              <p>
                We use cookies, session storage, local storage, and similar technologies to support login sessions,
                remember preferences, apply security protections, detect abuse, and understand platform usage.
              </p>
              <p>
                Some cookies are strictly necessary for authentication and security. Others may support platform
                performance, diagnostics, and feature behavior. If you block essential cookies or storage, some parts of
                the service may not function correctly.
              </p>
            </div>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>6. Data Sharing and Third-Party Services</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              We share personal data only where necessary to run FounderCentral, comply with law, or protect the
              platform. Categories of recipients may include infrastructure providers, analytics or monitoring services,
              and other service providers acting on our instructions.
            </p>
            <p>
              Our current core infrastructure includes Supabase for authentication, database, and storage services, and
              Hostinger for application hosting and server infrastructure. These providers may process
              data such as account metadata, uploaded files, database records, operational logs, and service telemetry
              to deliver their services to us.
            </p>
            <p>
              We may also disclose information if required by law, regulation, court order, lawful government request,
              or when necessary to investigate fraud, security incidents, abuse, or violations of our terms.
            </p>
            <p>
              If you are a business customer or enterprise user and need processor terms for customer data handled
              through FounderCentral, review our{' '}
              <Link to="/dpa" className="font-medium underline underline-offset-2" style={{ color: 'var(--blue)' }}>
                Data Processing Agreement
              </Link>
              .
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>7. Data Storage, Security, and Retention</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              We store data using access controls, authentication safeguards, transport encryption, logging, and other
              reasonable technical and organizational measures designed to protect confidentiality, integrity, and
              availability. No system is completely secure, and we cannot guarantee absolute security.
            </p>
            <p className="font-medium" style={{ color: 'var(--muted)' }}>Retention timelines generally follow the schedules below:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account and profile data: retained while your account is active and for a limited period afterward as needed for legal compliance, fraud prevention, dispute resolution, and backup recovery.</li>
              <li>Onboarding, matching, and portfolio records: retained while relevant to the active service relationship and then deleted or anonymized when no longer required.</li>
              <li>AI prompt and response logs: retained for a limited operational period for security, quality review, abuse detection, and debugging, then deleted or de-identified where feasible.</li>
              <li>Security logs and API telemetry: commonly retained for up to 12 months unless a longer period is required for incident investigation or legal obligations.</li>
              <li>Uploaded pitch decks and media: retained until you remove them, close your account, or we determine they are no longer needed for the service.</li>
              <li>Support records and legal compliance records: retained as long as reasonably necessary to handle the issue, prove compliance, or defend legal claims.</li>
            </ul>
            <p>
              For a more detailed schedule covering retention categories, deletion timelines, AI prompt storage, and
              governance roles, review our{' '}
              <Link to="/data-governance" className="font-medium underline underline-offset-2" style={{ color: 'var(--blue)' }}>
                Data Governance Policy
              </Link>
              .
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>8. User Rights and Choices</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>Subject to applicable law, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access personal data we hold about you.</li>
              <li>Request correction of inaccurate or incomplete data.</li>
              <li>Request deletion of your account or certain personal data.</li>
              <li>Object to or restrict certain types of processing.</li>
              <li>Request a copy of certain data in a portable format where legally required.</li>
              <li>Withdraw consent where processing relies on consent.</li>
            </ul>
            <p>
              You can update many profile fields directly inside the product. For access, deletion, correction, or
              privacy requests that cannot be completed in-product, contact us using the details below. We may need to
              verify your identity before fulfilling a request.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>9. GDPR Information for EU Users</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              If you are in the European Economic Area, United Kingdom, or Switzerland, you may have rights under the
              GDPR or similar local law. Our legal bases for processing may include performance of a contract, legitimate
              interests in operating and securing the platform, compliance with legal obligations, and consent where
              required.
            </p>
            <p>
              EU users may request access, rectification, erasure, restriction, objection, and portability where
              applicable. You may also have the right to lodge a complaint with your local supervisory authority if you
              believe our processing violates applicable law.
            </p>
            <p>
              Where data is transferred outside your jurisdiction, we rely on appropriate safeguards where required under
              law, such as contractual protections or lawful transfer mechanisms provided by our service providers.
            </p>
            <p>
              Additional details for EU users, including rights request handling and DPO contact information, are
              available on our{' '}
              <Link to="/gdpr" className="font-medium underline underline-offset-2" style={{ color: 'var(--blue)' }}>
                GDPR Compliance
              </Link>
              {' '}page.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>10. Children&apos;s Privacy</h2>
          <p style={bodyStyle}>
            FounderCentral is intended for professional and business users and is not directed to children. We do not
            knowingly collect personal data from children where prohibited by law. If you believe a child has provided
            personal data to us, contact us so we can investigate and take appropriate action.
          </p>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>11. Changes to This Policy</h2>
          <p style={bodyStyle}>
            We may update this Privacy Policy from time to time to reflect legal, technical, or business changes. When
            we make material changes, we will update the effective date and may provide additional notice inside the
            product or by email where appropriate.
          </p>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>12. Contact Information</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              For privacy, data protection, access, correction, deletion, or GDPR-related requests, contact:
            </p>
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--muted)' }}
            >
              <p><strong>FounderCentral Privacy Team</strong></p>
              <p>Email: privacy@foundercentral.in</p>
              <p>Support: support@foundercentral.in</p>
              <p>Website: https://foundercentral.in</p>
            </div>
            <p>
              If you contact us, please include enough detail for us to understand and verify your request. We will
              respond within the time required by applicable law.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
