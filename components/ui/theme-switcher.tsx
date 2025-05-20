'use client'

import { useTheme } from '@/contexts/theme-context'
import { themes, ThemeName } from '@/lib/themes'
import { Check, ChevronDown } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <span>Theme: {themes[theme]?.name || 'Default'}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(themes).map(([themeName, themeData]) => (
          <DropdownMenuItem
            key={themeName}
            onClick={() => setTheme(themeName as ThemeName)}
            className="flex items-center justify-between"
          >
            <span>{themeData.name}</span>
            {theme === themeName && <Check className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
