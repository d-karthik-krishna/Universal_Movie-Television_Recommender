export const SITE_NAME = 'CineSphere'
export const SITE_DESCRIPTION =
  'Discover movies you would love, from anywhere in the world.'
export const API_URL = typeof window === 'undefined' 
  ? process.env.INTERNAL_API_URL || 'http://localhost:8000'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Design tokens
export const CARD_RADIUS = 'rounded-[20px]'
export const CONTROL_RADIUS = 'rounded-[14px]'
export const CHIP_RADIUS = 'rounded-full'
export const SPACING = {
  xs: 'gap-2', // 8px
  sm: 'gap-3', // 12px
  md: 'gap-4', // 16px
  lg: 'gap-6', // 24px
  xl: 'gap-8', // 32px
  '2xl': 'gap-12', // 48px
  '3xl': 'gap-16', // 64px
} as const
