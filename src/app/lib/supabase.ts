import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

function parseJwtPayload(token: string) {
  const [, payload] = token.split('.')
  if (!payload) return null

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(window.atob(padded)) as { role?: string } | null
  } catch {
    return null
  }
}

if (!supabaseUrl || !supabaseAnon) {
  throw new Error('Supabase environment variables are missing')
}

const supabaseJwtPayload = parseJwtPayload(supabaseAnon)
if (supabaseJwtPayload?.role === 'service_role') {
  throw new Error('VITE_SUPABASE_ANON_KEY must never contain a service role key')
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
    storage: sessionStorage,
  },
})
