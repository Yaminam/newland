interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  /** Use "light" on dark backgrounds so the wordmark text is white */
  variant?: 'default' | 'light'
}

export function FounderCentralLogo({ size = 'md', variant = 'default' }: LogoProps) {
  const sizeMap = { sm: 32, md: 42, lg: 48 }

  return (
    <img
      src="/logo.svg"
      alt="FounderCentral"
      className="fc-logo-img"
      style={{
        height: `${sizeMap[size]}px`,
        width: 'auto',
        objectFit: 'contain',
        flexShrink: 0,
        ...(variant === 'light' ? { filter: 'brightness(0) invert(1)' } : {}),
      }}
    />
  )
}
