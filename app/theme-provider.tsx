'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProvider as CustomThemeProvider } from '@/contexts/theme-context'

export function ThemeProvider({ children, ...props }: React.PropsWithChildren) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
      <CustomThemeProvider>
        {children}
      </CustomThemeProvider>
    </NextThemesProvider>
  )
}
