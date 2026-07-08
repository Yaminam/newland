# SOC 2 Readiness Summary

This document summarizes current SOC 2-relevant controls visible in the FounderCentral repo, the evidence that should be gathered for an audit, and the major remaining gaps before a full Type II certification effort.

## Implemented controls

- Authentication baseline documented in `docs/auth-security.md`.
- Supabase Auth configured in `src/app/lib/supabase.ts` with:
  - PKCE auth flow
  - persistent sessions stored in `sessionStorage`
  - startup validation preventing a service-role key from being exposed in the frontend
- Verified-email sign-in, password policy enforcement guidance, and inactivity/session controls described in `docs/auth-security.md`.
- Abuse protection documented in `docs/abuse-protection.md`, including:
  - client-side throttling for login, signup, and password reset
  - server-side rate limiting for AI chat, security event, and CSP report endpoints
  - per-IP and per-user throttling for AI generation
- Input validation and sanitization in `src/app/lib/inputSecurity.ts`, including:
  - text sanitization
  - URL validation
  - date validation
  - filename and upload validation
  - Zod schemas for AI chat, security events, and CSP reports
- Security event logging in `src/app/lib/securityEvents.ts`, including:
  - auth attempt and failure logging
  - frontend error logging
  - unhandled rejection logging
  - delivery to the security event endpoint using `sendBeacon` or `fetch`
- Deployment guidance in `docs/secure-deployment.md`, including:
  - HTTPS and HSTS requirements
  - secret management requirements
  - RLS expectations
  - logging and monitoring expectations
  - post-deployment validation steps
- Legal and privacy documentation published in the app:
  - Privacy Policy
  - DPA
  - GDPR page
  - Data Governance Policy
  - AI Transparency Statement
  - API Usage & Abuse Policy

## Evidence collection checklist

- Authentication and access
  - Supabase Auth configuration screenshots or exports
  - password policy settings
  - email verification settings
  - token expiry settings
  - privileged access inventory
- Logging and monitoring
  - sample security event logs
  - sample CSP report logs
  - server log retention settings
  - Supabase Auth log review evidence
- Abuse protection
  - rate limiting configuration for server endpoints
  - sample 429 responses and alerting records
  - evidence of AI route user/IP throttling
- Secure development controls
  - pull request review records
  - change approval or deployment records
  - secure deployment checklist completion evidence
- Data protection
  - current DPA template
  - GDPR request handling records
  - retention and deletion workflow evidence
  - sub-processor inventory
- Infrastructure and secrets
  - server environment-variable access controls
  - Supabase project access review
  - proof that service-role keys are not used in frontend code
- Vulnerability management
  - penetration test report or summary
  - remediation tracking for findings
  - dependency review or security patch records

## Gaps and remediation plan

- Provider-side auth controls still need validation in production.
  - Enable and document Supabase-side rate limits, email verification, short-lived reset links, and token expiry settings.
- Centralized audit evidence collection is not yet formalized.
  - Create a recurring evidence folder or GRC tracker for logs, screenshots, approvals, access reviews, and incident records.
- Formal control ownership is only partially documented.
  - Assign named owners for access reviews, incident response, vendor management, and policy maintenance.
- RLS and privileged-access verification need ongoing evidence.
  - Confirm the required migration is applied and record periodic access-control testing.
- Penetration testing and vulnerability management need an auditable cadence.
  - Schedule recurring external testing and maintain remediation tickets to closure.
- Personnel and policy controls are not fully represented in the repo.
  - Add onboarding/offboarding checklists, security awareness tracking, NDA confirmation records, and change-management evidence.

## Suggested next steps

1. Convert documented controls into an internal control matrix mapped to SOC 2 criteria.
2. Collect baseline evidence for one audit period and identify missing artifacts.
3. Close provider configuration gaps in Supabase and the hosting server.
4. Run a readiness assessment before starting a Type II observation window.
