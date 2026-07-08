# Secure Deployment Checklist

This application is a Vite SPA deployed on a self-hosted server (Hostinger) with Supabase as the backend. Some deployment controls can be enforced in this repo, while others must be configured on the server and in Supabase.

## HTTPS

- Deploy only behind HTTPS.
- Ensure the hosting server serves production traffic over HTTPS.
- Keep `Strict-Transport-Security` enabled.
- Keep CSP directives `upgrade-insecure-requests` and `block-all-mixed-content` enabled.
- Redirect any custom domain traffic to HTTPS at the CDN or hosting layer.

## Secrets

- Store secrets only in server environment variables and Supabase environment-variable managers.
- Never commit `.env.local` or any privileged credential.
- Never expose:
  - Supabase service-role keys
  - Database passwords
  - JWT signing secrets
  - Third-party API secrets
- The browser may only receive public values such as:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_APP_URL`

## Database Exposure

- Do not expose the raw database port to the public internet.
- Use Supabase Row Level Security for every user-scoped table.
- Restrict direct Postgres access to trusted admin IPs or private networking where your Supabase plan supports it.
- Prefer:
  - Supabase Auth + RLS for browser access
  - Edge Functions or trusted backend services for privileged operations
- Do not use the service-role key in browser code.

## Logging and Monitoring

- Review server logs for security events and CSP reports.
- Review Supabase Auth logs for:
  - failed sign-ins
  - password reset activity
  - unusual token activity
- Review Supabase database logs for:
  - repeated RLS denials
  - unexpected query spikes
- Alert on:
  - bursts of failed login attempts from one IP
  - repeated password reset requests
  - repeated 401/403/429 responses
  - abnormal traffic concentration on one route

## Required Server Configuration

- Set production environment variables on the server (e.g., via Hostinger environment configuration).
- Limit team access to environment-variable management.
- Enable log retention and ship logs to a SIEM if available.

## Required Supabase Configuration

- Apply the RLS migration in `supabase/migrations/20260415_enforce_ownership_rls.sql`.
- Enable email verification and short-lived reset links.
- Enable auth rate limiting in Supabase.
- Restrict privileged keys to server-side environments only.

## Validation After Deployment

1. Confirm the app loads only over `https://`.
2. Confirm mixed-content requests are blocked.
3. Confirm `.env.local` is not present in the build output.
4. Confirm login failures and reset requests appear in server security event logs.
5. Confirm CSP violations appear in server CSP report logs.
6. Confirm user-scoped records cannot be accessed or modified across accounts.
