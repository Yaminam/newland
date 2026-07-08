import React from 'react'
import { motion } from 'framer-motion'

type CardVariant = 'glass' | 'solid' | 'elevated' | 'surface'

interface CardProps {
  variant?: CardVariant
  hover?: boolean
  animate?: boolean
  delay?: number
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({
  variant = 'glass',
  hover = false,
  animate = false,
  delay = 0,
  children,
  className = '',
  onClick,
}: CardProps) {
  const variants: Record<CardVariant, string> = {
    glass: 'card p-6',
    solid: 'card-solid p-6',
    elevated: 'card-elevated p-6',
    surface: 'bg-[var(--surface-2)] rounded-[16px] p-6',
  }

  const hoverClass = hover ? 'card-hover-lift cursor-pointer' : ''
  const combined = `${variants[variant]} ${hoverClass} ${className}`

  if (animate) {
    return (
      <motion.div
        className={combined}
        onClick={onClick}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={combined} onClick={onClick}>
      {children}
    </div>
  )
}
