import { motion } from 'framer-motion'
import { cn } from '@/app/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  icon,
  action,
  className,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'mb-6 flex items-center justify-between gap-4 flex-wrap',
        className,
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {icon ? (
          <div
            className="shrink-0 w-11 h-11 rounded-[12px] flex items-center justify-center"
            style={{
              background: 'var(--blue-bg)',
              color: 'var(--blue)',
              border: '1px solid rgba(37,99,235,0.12)',
            }}
          >
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: '28px',
              color: 'var(--ink)',
              fontFamily: 'var(--font-display)',
              margin: 0,
            }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--muted)',
                marginTop: 2,
                lineHeight: '18px',
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {action ? (
        <div className="flex items-center gap-2 flex-wrap sm:shrink-0 w-full sm:w-auto">
          {action}
        </div>
      ) : null}
    </motion.div>
  )
}
