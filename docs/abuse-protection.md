# Abuse Protection

This repo now applies abuse controls in two places:

## In-app controls

- Client-side login throttling
- Client-side signup throttling
- Client-side password-reset throttling
- Server-side rate limiting for Supabase Edge Functions handling AI chat, security events, and CSP reports
- Per-IP and per-user throttling for AI generation requests
- Security logging for auth failures, API failures, and unusual request bursts

## Important limits of browser-only protection

The app still uses Supabase Auth directly from the browser for login, signup, and password reset. Client-side throttling slows abuse from a browser session, but it is not the authoritative control.

You must also enable provider-side limits in Supabase:

1. Auth rate limiting for sign-in attempts
2. Auth rate limiting for sign-up attempts
3. Auth rate limiting for password reset requests
4. CAPTCHA or bot protection if your Supabase plan and deployment support it

## AI generation route

All AI generation requests are routed through a Supabase Edge Function. This function:

- validates the bearer token
- derives the authenticated user server-side
- rate-limits by IP
- rate-limits by user account
- logs abuse signals

## Monitoring

Watch server logs for:

- `AI_CHAT_RATE_LIMIT_IP`
- `AI_CHAT_RATE_LIMIT_USER`
- `SECURITY_EVENT_UNUSUAL_TRAFFIC`
- `SECURITY_EVENT_RATE_LIMITED`
- `CSP_REPORT_RATE_LIMITED`
