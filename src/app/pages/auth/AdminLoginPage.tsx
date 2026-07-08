import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/app/context/AuthContext'
import { supabase } from '@/app/lib/supabase'
import { loginSchema, type LoginFormData } from '@/app/lib/validation'
import { SEO } from '@/app/components/SEO'

export function AdminLoginPage() {
  const { login, isAuthenticated, profile, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (!authLoading && isAuthenticated && profile?.access_role === 'admin') {
      navigate('/internal/garagecollective/controlpanel', { replace: true })
    }
  }, [authLoading, isAuthenticated, profile, navigate])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      await login(data.email, data.password)

      const { data: session } = await supabase.auth.getUser()
      const uid = session.user?.id
      if (!uid) throw new Error('Authentication failed.')

      const { data: row } = await supabase
        .from('profiles')
        .select('access_role')
        .eq('id', uid)
        .maybeSingle()

      if (row?.access_role !== 'admin') {
        await supabase.auth.signOut()
        toast.error('This account is not authorized for admin access.')
        return
      }

      navigate('/internal/garagecollective/controlpanel', { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials.'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <SEO title="Admin Sign In" path="/admin/login" noindex />
      <div
        className="min-h-screen w-full flex items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)',
      }}
    >
      <div
        className="w-full max-w-md"
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          padding: '2.5rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="flex items-center justify-center mb-4"
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              boxShadow: '0 6px 16px rgba(15,23,42,0.25)',
            }}
          >
            <ShieldCheck className="w-7 h-7" style={{ color: 'var(--surface)' }} />
          </div>
          <h1
            className="font-bold mb-2"
            style={{
              fontSize: '1.5rem',
              color: 'var(--ink)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
            }}
          >
            Admin Console
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Restricted access. Credentials required.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label
              className="block text-sm font-medium"
              style={{ color: 'var(--muted)', letterSpacing: '0.05em' }}
            >
              Admin Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: 'var(--muted-2)' }}
              />
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="admin@foundercentral.in"
                className={`fc-input${errors.email ? " input-error" : ""}`}
                style={{
                  height: 44,
                  paddingLeft: '2.5rem',
                  paddingRight: '1rem',
                  background: 'var(--surface)',
                  
                  borderRadius: 8,
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-body)',
                  transition: 'border-color 150ms ease, box-shadow 150ms ease',
                }}
              />
            </div>
            {errors.email && (
              <p className="text-xs" style={{ color: 'var(--neg)' }}>{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              className="block text-sm font-medium"
              style={{ color: 'var(--muted)', letterSpacing: '0.05em' }}
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: 'var(--muted-2)' }}
              />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className={`fc-input${errors.email ? " input-error" : ""}`}
                style={{
                  height: 44,
                  paddingLeft: '2.5rem',
                  paddingRight: '2.5rem',
                  background: 'var(--surface)',
                  
                  borderRadius: 8,
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-body)',
                  transition: 'border-color 150ms ease, box-shadow 150ms ease',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--muted-2)' }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs" style={{ color: 'var(--neg)' }}>{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 font-semibold transition-all"
            style={{
              height: 48,
              fontSize: '0.9375rem',
              background: isLoading ? 'rgba(15,23,42,0.6)' : 'var(--ink)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: isLoading ? 'none' : '0 1px 2px rgba(0,0,0,0.2)',
            }}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Sign in to Admin <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--muted-2)' }}>
          All access is audit-logged.
        </p>
      </div>
    </div>
    </>
  )
}
