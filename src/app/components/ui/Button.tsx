import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/app/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  iconLeft?: React.ElementType
  iconRight?: React.ElementType
  children: React.ReactNode
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-[14px] gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2.5',
}

const iconSizes: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18 }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      iconLeft: IconLeft,
      iconRight: IconRight,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const iconSize = iconSizes[size]

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.1 }}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-colors duration-150 cursor-pointer select-none',
          'rounded-[var(--r-md)]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]',
          'disabled:opacity-50 disabled:pointer-events-none',
          sizeClasses[size],
          variant === 'primary' &&
            'bg-[var(--blue)] text-white hover:bg-[var(--blue-h)] shadow-[var(--sh-2)]',
          variant === 'secondary' &&
            'bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--surface-2)]',
          variant === 'ghost' &&
            'bg-transparent text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]',
          variant === 'link' &&
            'bg-transparent text-[var(--blue)] hover:underline h-auto px-0 shadow-none',
          variant === 'danger' &&
            'bg-[var(--neg)] text-white hover:brightness-90',
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 size={iconSize} className="animate-spin" />
        ) : IconLeft ? (
          <IconLeft size={iconSize} />
        ) : null}
        {children}
        {!isLoading && IconRight ? <IconRight size={iconSize} /> : null}
      </motion.button>
    )
  },
)
Button.displayName = 'Button'
