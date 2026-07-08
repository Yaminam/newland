import { Link } from 'react-router-dom'
import { SEO } from '@/app/components/SEO'
import { ArrowLeft, Brain, CircleAlert, Eye, LifeBuoy, Mail, Settings2, ShieldCheck } from 'lucide-react'

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

export function AITransparencyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-2)' }}>
      <SEO
        title="AI Transparency"
        description="How FounderCentral uses AI for matching, suggestions, and support. What we do, what we don't, and what stays in your control."
        path="/ai-transparency"
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
              <Brain className="w-7 h-7" />
            </div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: 'var(--surface)' }}>
              AI Transparency Statement
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.7, fontSize: '1rem' }}>
              FounderCentral uses AI to support discovery, analysis, and workflow assistance across the platform. This
              statement explains what AI features are available, how they work at a high level, how user data may be
              used in connection with them, and the safeguards and limitations users should understand before relying on
              any AI-generated output.
            </p>
          </div>
        </header>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>1. AI Features on the Platform</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>FounderCentral may use AI-assisted systems in areas such as:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>AI chat experiences that help users summarize profiles, explore fundraising or investor discovery workflows, and draft platform-related content.</li>
              <li>Investor and founder matching suggestions based on profile data, sector preferences, stage, geography, traction signals, and platform activity.</li>
              <li>Summaries, recommendations, rankings, categorizations, and workflow assistance within discovery, research, and matching surfaces.</li>
              <li>Internal safety, abuse detection, product diagnostics, and quality review processes that help improve AI-assisted functionality.</li>
            </ul>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Settings2 className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>2. Models and Services Used</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              FounderCentral may use a combination of internally designed ranking logic, embeddings, retrieval
              workflows, and third-party AI model providers to power AI-assisted features. These providers may include
              large language model services and related inference infrastructure used to generate natural language
              responses, summaries, and recommendations.
            </p>
            <p>
              Specific model versions and service providers may change over time as we improve performance, reliability,
              safety, and cost efficiency. We may also use multiple model providers or fallback systems depending on the
              feature, region, workload, and availability requirements.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <CircleAlert className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>3. How to Interpret AI Outputs</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              AI outputs are intended to support user workflows, not replace professional judgment. Suggestions,
              summaries, rankings, and responses generated by AI should be treated as informational assistance only.
            </p>
            <p>
              AI-generated content is not financial advice, investment advice, legal advice, tax advice, compliance
              advice, or due diligence confirmation. Users must independently evaluate AI outputs and make their own
              decisions about fundraising, investing, outreach, and regulatory matters.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>4. Limitations and Risks</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              AI systems can generate incorrect, incomplete, outdated, oversimplified, or biased outputs. They may miss
              important context, infer facts that are not supported, or produce recommendations that are unsuitable for
              a user&apos;s goals or regulatory environment.
            </p>
            <p>
              Matching suggestions and AI-generated summaries may reflect the quality and completeness of underlying
              data, and they may not capture all relevant commercial, legal, ethical, or investment considerations.
              Users should not assume that an AI output is accurate simply because it appears confident or detailed.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>5. How User Data Interacts with AI</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              When users interact with AI-assisted features, FounderCentral may send relevant prompt text, profile
              information, preference data, message context, listing data, and related workflow inputs to AI systems or
              service providers as needed to generate the requested result.
            </p>
            <p>
              FounderCentral may store prompts, outputs, metadata, and associated usage logs for security monitoring,
              abuse prevention, debugging, product improvement, and service administration. We advise users not to enter
              highly sensitive personal information, government identifiers, bank credentials, or other unnecessary
              sensitive data into AI prompts unless the workflow expressly requires it and appropriate safeguards are in
              place.
            </p>
            <p>
              For a dedicated explanation of retention timelines, deletion options, provider sharing, and storage
              controls, review our{' '}
              <Link to="/prompt-storage-policy" className="font-medium underline underline-offset-2" style={{ color: 'var(--blue)' }}>
                Prompt and Output Storage Policy
              </Link>
              .
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>6. Human Oversight and User Control</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              Human users remain responsible for final decisions made using FounderCentral. AI tools may assist with
              analysis, drafting, or prioritization, but they do not make binding investment, fundraising, legal, or
              compliance decisions on behalf of users.
            </p>
            <p>
              Users are expected to review AI-generated responses, verify material facts, and decide whether and how to
              act on any suggestion. FounderCentral may provide workflows that allow users to accept, ignore, revise,
              or override AI-assisted outputs.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <LifeBuoy className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>7. Reporting Incorrect or Harmful Outputs</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              If you receive an AI-generated output that is incorrect, misleading, harmful, offensive, unsafe, or
              otherwise inappropriate, you should stop relying on it and report the issue to FounderCentral.
            </p>
            <p>
              Reports should include a description of the issue, the relevant feature, the date and approximate time,
              and any prompt or output details necessary for investigation. We review reports to improve safety,
              identify misuse patterns, and refine model behavior or product controls where appropriate.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>8. Monitoring and Improvement</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              FounderCentral monitors AI quality using a combination of product telemetry, user feedback, incident
              review, safety testing, prompt and response analysis, and operational safeguards. We may update prompts,
              ranking logic, filters, or provider configurations to improve reliability, relevance, and safety.
            </p>
            <p>
              We aim to reduce inaccurate, harmful, or low-quality outputs over time, but no AI system can be made
              perfect. Ongoing monitoring and iterative improvement are part of how we operate AI-assisted features on
              the platform.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>9. Contact and Feedback</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              Questions about AI-assisted features, safety concerns, or reports about incorrect outputs can be sent to:
            </p>
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--muted)' }}
            >
              <p><strong>FounderCentral AI Review Team</strong></p>
              <p>Email: ai@foundercentral.in</p>
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
