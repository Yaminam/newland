# Authentication Security Baseline

This project uses Supabase Auth. The frontend enforces verified-email sign-in, stronger password rules, browser-session inactivity expiry, and client-side throttling. The controls below must also be configured in Supabase to complete the auth hardening.

## Required Supabase Auth settings

1. Enable email confirmations.
   Require users to verify their email before they can sign in.

2. Enforce the same password policy as the frontend.
   Minimum length: `8`
   Require: uppercase, lowercase, number, symbol

3. Set short-lived access tokens.
   Recommended JWT expiry: `60 minutes` or less.

4. Set password reset link expiry.
   Recommended expiry: `60 minutes` or less.

5. Enable server-side rate limits.
   Apply rate limits for:
   `signInWithPassword`
   `signUp`
   `resetPasswordForEmail`

6. Never use the service-role key in the frontend.
   Only expose `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   Keep the service-role key only in trusted backend or Supabase Edge Function environments.

## Notes

- Password hashing is handled by Supabase Auth on the server. The frontend must never hash or store passwords itself.
- The browser client now stores auth state in `sessionStorage` and signs users out after inactivity, but the authoritative token lifetime is still controlled by Supabase.
- Client-side throttling slows abuse from a single browser session. It does not replace server-side rate limiting.
