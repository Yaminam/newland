import React from 'react'

interface SkeletonLoaderProps {
  width?: string
  height?: string
  borderRadius?: string
  className?: string
}

export function SkeletonLoader({
  width = '100%',
  height = '20px',
  borderRadius = 'var(--r-sm)',
  className = '',
}: SkeletonLoaderProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
      }}
    />
  )
}
