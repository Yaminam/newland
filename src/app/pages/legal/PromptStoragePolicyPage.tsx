import { Link } from 'react-router-dom'
import { SEO } from '@/app/components/SEO'
import { ArrowLeft, Brain, Database, EyeOff, FileClock, Mail, ShieldCheck, Trash2 } from 'lucide-react'

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

export function PromptStoragePolicyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-2)' }}>
      <SEO
        title="Prompt Storage Policy"
        description="How FounderCentral stores, retains, and uses AI prompts and conversations. What's logged, for how long, and why."
        path="/prompt-storage-policy"
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
              Prompt and Output Storage Policy
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.7, fontSize: '1rem' }}>
              This policy explains how FounderCentral stores, uses, protects, and deletes prompts and outputs created
              through AI-assisted features on the platform. It is intended to give users a clear understanding of what
              is retained, what should not be entered into AI chat, and what options exist for deletion and opt-out.
            </p>
          </div>
        </header>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>1. What AI Prompts and Outputs Are</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              An <strong>AI prompt</strong> is the text, request, question, or structured input a user sends to an
              AI-assisted feature in FounderCentral. An <strong>AI output</strong> is the response, summary,
              recommendation, ranking, or other generated content returned by the AI system.
            </p>
            <p>
              Prompts and outputs may also include supporting metadata such as timestamps, feature mode, user account
              context, or session identifiers required to deliver the feature securely and consistently.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>2. What Gets Stored</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>When users interact with AI features, FounderCentral may store:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>User messages and prompts sent to AI-assisted features.</li>
              <li>AI responses, summaries, recommendations, and other outputs generated in response.</li>
              <li>Associated metadata such as timestamps, request mode, session context, and operational logs needed for troubleshooting or abuse prevention.</li>
            </ul>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <EyeOff className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>3. What Should Not Be Stored or Submitted</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              FounderCentral does not intend for users to submit highly sensitive information into general AI chat
              workflows. Users should avoid entering passwords, private keys, government identifiers, banking
              credentials, highly sensitive financial account details, or unnecessary personally identifiable
              information into AI prompts.
            </p>
            <p>
              If a user submits sensitive information despite this guidance, FounderCentral may still temporarily
              process or log that content as part of the interaction. Users remain responsible for limiting what they
              choose to enter into AI-assisted features.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <FileClock className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>4. Retention Periods</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Active session data:</strong> transient conversation context may be retained for the duration of the active AI session and short operational windows needed to support continuity and security.</li>
              <li><strong>Logged-in user chat history:</strong> prompts, outputs, and related metadata may be stored for up to 12 months for continuity, abuse detection, debugging, quality monitoring, and product improvement unless a shorter retention schedule applies to a specific feature.</li>
              <li><strong>Deleted account data:</strong> when an account is deleted, associated prompt and output records are targeted for deletion or de-identification within a commercially reasonable period, commonly within 30 days, subject to backup rotation, legal obligations, and active security investigations.</li>
            </ul>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>5. How Prompts and Outputs Are Used</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>Stored prompts and outputs may be used to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide conversation continuity and feature functionality.</li>
              <li>Debug errors, investigate failures, and troubleshoot user-reported issues.</li>
              <li>Monitor quality, relevance, safety, and abuse patterns in AI-assisted features.</li>
              <li>Improve prompts, workflows, controls, and system performance over time.</li>
            </ul>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>6. Third-Party AI Providers</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              FounderCentral may share prompt content, relevant contextual inputs, and generated outputs with
              third-party AI model providers when necessary to deliver AI-assisted features. These providers process
              data under contractual and technical terms intended to support secure service delivery and lawful data
              handling.
            </p>
            <p>
              FounderCentral seeks to limit the data sent to what is reasonably necessary for the requested feature and
              may update providers or model configurations over time to improve safety, privacy, performance, and
              reliability.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>7. Deleting AI Chat History</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              Users may request deletion of stored AI chat history by using in-product controls where available or by
              contacting FounderCentral support or privacy contacts. We may verify identity before acting on a request.
            </p>
            <p>
              Deletion requests are generally processed within 30 days, subject to legal requirements, backup cycles,
              security reviews, and operational constraints.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-4">
          <h2 className="text-2xl font-semibold" style={headingStyle}>8. Opt-Out Options</h2>
          <div style={bodyStyle} className="space-y-3">
            <p>
              Users who do not want prompts or outputs retained beyond what is necessary for immediate feature delivery
              may contact FounderCentral to request available opt-out options or account-level handling preferences,
              subject to feature limitations and operational requirements.
            </p>
            <p>
              Some AI-assisted features may not function properly if storage required for continuity, abuse prevention,
              or troubleshooting is disabled. Where an opt-out materially affects the feature, FounderCentral may limit
              or disable the relevant AI experience.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>9. Security Measures</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              FounderCentral protects stored prompts and outputs using access controls, authenticated platform access,
              encrypted transport, operational logging, abuse detection, and managed infrastructure protections designed
              to reduce unauthorized access, disclosure, alteration, or loss.
            </p>
            <p>
              No system can guarantee absolute security, but prompt and output records are handled within the same
              broader security, privacy, and governance framework that applies to other platform data.
            </p>
          </div>
        </section>

        <section style={sectionStyle} className="space-y-5">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5" style={{ color: 'var(--blue)' }} />
            <h2 className="text-2xl font-semibold" style={headingStyle}>10. Contact Details</h2>
          </div>
          <div style={bodyStyle} className="space-y-3">
            <p>
              Questions about prompt retention, deletion, provider handling, or AI storage practices can be sent to:
            </p>
            <div
              className="rounded-2xl p-4"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--muted)' }}
            >
              <p><strong>FounderCentral Privacy and AI Team</strong></p>
              <p>Email: privacy@foundercentral.in</p>
              <p>AI: ai@foundercentral.in</p>
              <p>Support: support@foundercentral.in</p>
              <p>Website: https://foundercentral.in</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
