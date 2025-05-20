'use client'

import { useEffect } from 'react'
import { useTheme } from '@/contexts/theme-context'

/**
 * This component applies the theme CSS variables to the document root
 * It should be included in the app layout to ensure theme is applied on initial load
 */
export function ThemeInitializer() {
  const { theme } = useTheme()

  useEffect(() => {
    // This effect runs on client-side only
    // It ensures the theme is applied on initial load and when theme changes
    const applyThemeToDocument = async () => {
      // Dynamically import the theme functions to avoid server-side issues
      const { applyTheme } = await import('@/lib/themes')
      applyTheme(theme)
    }

    applyThemeToDocument()
  }, [theme])

  // This component doesn't render anything
  return null
}
