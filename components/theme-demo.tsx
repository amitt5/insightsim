'use client'

import { ThemeInitializer } from '@/components/theme-initializer'
import { useTheme } from '@/contexts/theme-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Component to demonstrate the theme styling on various UI elements
 */
export function ThemeDemo() {
  const { theme } = useTheme()
  
  return (
    <div className="space-y-8 p-6">
      <ThemeInitializer />
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Theme Demo: {theme}</h2>
        <p className="text-muted-foreground">
          This page demonstrates the styling of various UI components with the current theme.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Various button styles with the current theme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="default">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="default" size="sm">Small</Button>
              <Button variant="default" size="default">Default</Button>
              <Button variant="default" size="lg">Large</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="default" disabled>Disabled</Button>
              <Button variant="default" className="animate-pulse">Loading...</Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Forms */}
        <Card>
          <CardHeader>
            <CardTitle>Form Elements</CardTitle>
            <CardDescription>Input fields and form controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Enter your name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="disabled">Disabled</Label>
              <Input id="disabled" disabled placeholder="Disabled input" />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Submit</Button>
          </CardFooter>
        </Card>
        
        {/* Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Card Styles</CardTitle>
            <CardDescription>Various card styles and layouts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Card>
              <CardHeader className="bg-muted/50">
                <CardTitle className="text-sm">Nested Card</CardTitle>
              </CardHeader>
              <CardContent className="text-sm p-3">
                This is a nested card with a muted header background.
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-sm">Primary Accent</CardTitle>
              </CardHeader>
              <CardContent className="text-sm p-3">
                This card has primary color accents.
              </CardContent>
            </Card>
            <Card className="border-secondary/20">
              <CardHeader className="bg-secondary/5">
                <CardTitle className="text-sm">Secondary Accent</CardTitle>
              </CardHeader>
              <CardContent className="text-sm p-3">
                This card has secondary color accents.
              </CardContent>
            </Card>
          </CardContent>
        </Card>
        
        {/* Loading States */}
        <Card>
          <CardHeader>
            <CardTitle>Loading States</CardTitle>
            <CardDescription>Skeleton loaders and loading indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-[140px]" />
                <Skeleton className="h-4 w-[180px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
