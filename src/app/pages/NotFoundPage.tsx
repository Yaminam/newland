import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home } from 'lucide-react'
import { SEO } from '@/app/components/SEO'

export function NotFoundPage() {
  return (
    <>
      <SEO title="Page Not Found" path="" noindex />
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="text-8xl font-bold mb-4"
          style={{
            background: 'linear-gradient(135deg, #1D4ED8, #2563EB)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'var(--font-display)',
          }}>
          404
        </div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
          Page Not Found
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
          style={{ background: 'var(--blue)', color: 'white' }}>
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </motion.div>
    </div>
    </>
  )
}
