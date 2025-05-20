'use client'

import { useEffect } from 'react'
import { ThemeDemo } from '@/components/theme-demo'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'

export default function ThemeTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Theme Testing Page</h1>
        <ThemeSwitcher />
      </div>
      
      <div className="bg-card rounded-lg border shadow-sm">
        <ThemeDemo />
      </div>
      
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>This page allows you to test the theme system and view all UI components with the current theme.</p>
      </div>
    </div>
  )
}
