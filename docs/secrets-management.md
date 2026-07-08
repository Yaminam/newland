# Secrets Management

This project was scanned for committed credentials and unsafe secret usage.

## Scan result

- No committed service-role key, database password, private key, or access token was found in tracked source files.
- The only local env file detected was `.env.local`, and it contains browser-safe public config names only.
- `.env.local` is ignored by Git.

## Required rules

1. Browser code may only use `VITE_` variables that are safe to expose publicly.
2. API routes must use non-`VITE_` environment variables for server-only configuration.
3. Never commit:
   `SUPABASE_SERVICE_ROLE_KEY`
   database passwords
   JWT signing secrets
   private API keys
   PEM/PFX/P12 key material
4. Keep `.env`, `.env.*`, and local secret files out of Git. Only `.env.example` should be committed.

## Current split

Frontend-safe:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`

Server-only:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Operational guidance

- Store production secrets only in server environment variables or Supabase secret managers.
- Rotate any credential immediately if it is ever committed, even briefly.
- If a service-role key is needed in the future, it must only be used in trusted server-side code, never in `src/`.
