import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { colors } from '../lib/theme'

type IconProps = {
  size?: number
  color?: string
}

export function CopyIcon({ size = 13, color = colors.accentSoft }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 13 13" fill="none">
      <Rect x="4.2" y="4.2" width="7.8" height="7.8" rx="2" stroke={color} strokeWidth="1.4" />
      <Path
        d="M8.8 2.6V2.4A1.4 1.4 0 0 0 7.4 1H2.4A1.4 1.4 0 0 0 1 2.4v5A1.4 1.4 0 0 0 2.4 8.8h.2"
        stroke={color}
        strokeWidth="1.4"
      />
    </Svg>
  )
}

export function SlidersIcon({ size = 18, color = colors.muted }: IconProps) {
  return (
    <Svg width={size} height={(size * 16) / 18} viewBox="0 0 18 16" fill="none">
      <Path d="M1 3.5h16M1 12.5h16" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <Circle
        cx="6.2"
        cy="3.5"
        r="2.7"
        fill={colors.surface}
        stroke={colors.text}
        strokeWidth="1.7"
      />
      <Circle
        cx="11.8"
        cy="12.5"
        r="2.7"
        fill={colors.surface}
        stroke={colors.text}
        strokeWidth="1.7"
      />
    </Svg>
  )
}

export function RecenterIcon({ size = 20, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx="10" cy="10" r="5.6" stroke={color} strokeWidth="1.7" />
      <Circle cx="10" cy="10" r="2" fill={colors.accent} />
      <Path
        d="M10 1v2.4M10 16.6V19M1 10h2.4M16.6 10H19"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export function ChevronDownIcon({ size = 14, color = colors.faint }: IconProps) {
  return (
    <Svg width={size} height={(size * 8) / 14} viewBox="0 0 14 8" fill="none">
      <Path
        d="M1 1l6 6 6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function BackIcon({ size = 9, color = colors.muted }: IconProps) {
  return (
    <Svg width={size} height={(size * 16) / 9} viewBox="0 0 9 16" fill="none">
      <Path
        d="M8 1L1.5 8L8 15"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function LockIcon({ size = 11, color = colors.muted }: IconProps) {
  return (
    <Svg width={size} height={(size * 14) / 12} viewBox="0 0 12 14" fill="none">
      <Rect x="1" y="6" width="10" height="7" rx="2" stroke={color} strokeWidth="1.5" />
      <Path d="M3.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke={color} strokeWidth="1.5" />
    </Svg>
  )
}

export function GoogleLogo({ size = 19 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <Path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <Path
        fill="#FBBC05"
        d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <Path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </Svg>
  )
}
