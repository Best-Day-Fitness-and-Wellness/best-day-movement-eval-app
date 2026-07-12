import { useTheme } from '../ThemeContext'
import { brandLogoVariant } from '../utils/brand.js'

const LOGO_SOURCE = '/brand/best-day-logo-artboard.jpg'

export default function BrandHeader({ subtitle, address }) {
  const { C, mode } = useTheme()
  const variant = brandLogoVariant(mode)
  const logoLabel = variant === 'white'
    ? 'Best Day Fitness and Wellness white logo'
    : 'Best Day Fitness and Wellness full-color logo'

  return (
    <header style={{
      textAlign: 'center', padding: '16px 16px 14px',
      background: C.stickyBg, color: C.text,
      borderBottom: `4px solid ${C.orange}`,
    }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div
          role="img"
          aria-label={logoLabel}
          style={{
            width: 'min(100%, 300px)', height: 90, margin: '0 auto 4px',
            backgroundImage: `url(${LOGO_SOURCE})`, backgroundRepeat: 'no-repeat',
            backgroundSize: '230% auto',
            backgroundPosition: variant === 'white' ? '50% 85%' : '50% 35%',
          }}
        />
        <div style={{ fontSize: 14, color: C.text, fontWeight: 700 }}>{subtitle}</div>
        <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{address}</div>
      </div>
    </header>
  )
}
