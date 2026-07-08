import { lazy, Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Toaster } from 'sonner'
import { AuthProvider } from './app/context/AuthContext'
import { ThemeProvider } from './app/context/ThemeContext'
import { NotificationProvider } from './app/context/NotificationContext'
import { router } from './app/routes/routes'

// Lazy-load non-critical components that don't affect initial render
const CookieConsentBanner = lazy(() => import('./app/components/CookieConsentBanner').then(m => ({ default: m.CookieConsentBanner })))
const GoogleAnalytics = lazy(() => import('./app/components/GoogleAnalytics').then(m => ({ default: m.GoogleAnalytics })))

export function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <RouterProvider router={router} />
            <Suspense fallback={null}>
              <CookieConsentBanner />
              <GoogleAnalytics />
            </Suspense>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'var(--bg-overlay)',
                  border: '1px solid var(--border-muted)',
                  color: 'var(--text-primary)',
                },
              }}
            />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  )
}
