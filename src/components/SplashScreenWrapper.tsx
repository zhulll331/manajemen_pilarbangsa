'use client'

import dynamic from 'next/dynamic'

// Dynamic import dengan ssr: false HARUS ada di dalam Client Component
const SplashScreen = dynamic(
  () => import('@/components/SplashScreen').then((mod) => mod.SplashScreen),
  { ssr: false }
)

export function SplashScreenWrapper() {
  return <SplashScreen />
}
