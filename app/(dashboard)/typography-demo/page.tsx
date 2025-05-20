'use client'

import { Typography } from '@/components/ui/typography'
import { ThemeDemo } from '@/components/theme-demo'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'

export default function TypographyDemoPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <Typography variant="h1">Typography System</Typography>
        <ThemeSwitcher />
      </div>
      
      <div className="bg-card rounded-lg border shadow-sm p-6 mb-8">
        <Typography variant="h2" className="mb-6">Heading Styles</Typography>
        
        <div className="space-y-4">
          <Typography variant="h1">Heading 1 - Professional and Bold</Typography>
          <Typography variant="h2">Heading 2 - Section Titles</Typography>
          <Typography variant="h3">Heading 3 - Subsection Headings</Typography>
          <Typography variant="h4">Heading 4 - Card Titles and Groups</Typography>
          <Typography variant="h5">Heading 5 - Minor Sections</Typography>
          <Typography variant="h6">Heading 6 - Small Headings</Typography>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <Typography variant="h3" className="mb-6">Body Text</Typography>
          
          <div className="space-y-6">
            <div>
              <Typography variant="body-large" className="mb-2">Body Large</Typography>
              <Typography variant="body-large">
                This is larger body text, ideal for important paragraphs or featured content.
                It provides better readability for key information while maintaining a professional appearance.
              </Typography>
            </div>
            
            <div>
              <Typography variant="body" className="mb-2">Body Default</Typography>
              <Typography variant="body">
                This is the standard body text used throughout the application. It balances readability
                with space efficiency, making it perfect for most content areas. The line height
                and spacing are optimized for comfortable reading.
              </Typography>
            </div>
            
            <div>
              <Typography variant="body-small" className="mb-2">Body Small</Typography>
              <Typography variant="body-small">
                Smaller body text is used for secondary information, notes, or when space is limited.
                Despite its smaller size, it maintains readability through careful line height and spacing.
              </Typography>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <Typography variant="h3" className="mb-6">UI Text Elements</Typography>
          
          <div className="space-y-6">
            <div>
              <Typography variant="label" className="mb-2">Labels</Typography>
              <div className="flex flex-col gap-2">
                <Typography variant="label">Form Field Label</Typography>
                <Typography variant="label">Settings Option</Typography>
                <Typography variant="label">Configuration Label</Typography>
              </div>
            </div>
            
            <div>
              <Typography variant="caption" className="mb-2">Captions</Typography>
              <div className="flex flex-col gap-2">
                <Typography variant="caption">Image caption explaining content</Typography>
                <Typography variant="caption">Last updated: May 20, 2025</Typography>
                <Typography variant="caption">Additional information or context</Typography>
              </div>
            </div>
            
            <div>
              <Typography variant="overline" className="mb-2">Overline Text</Typography>
              <div className="flex flex-col gap-2">
                <Typography variant="overline">CATEGORY</Typography>
                <Typography variant="overline">STATUS UPDATE</Typography>
                <Typography variant="overline">NEW FEATURE</Typography>
              </div>
            </div>
            
            <div>
              <Typography variant="button" className="mb-2">Button Text</Typography>
              <div className="flex flex-wrap gap-2">
                <span className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded typography-button">
                  Primary Action
                </span>
                <span className="inline-block px-4 py-2 bg-secondary text-secondary-foreground rounded typography-button">
                  Secondary Action
                </span>
                <span className="inline-block px-4 py-2 border rounded typography-button">
                  Tertiary Action
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-card rounded-lg border shadow-sm p-6">
        <Typography variant="h3" className="mb-6">Text Utilities</Typography>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Typography variant="h4" className="mb-4">Truncation</Typography>
            
            <div className="space-y-4">
              <div>
                <Typography variant="label" className="mb-1">Single Line Truncation</Typography>
                <div className="w-64 bg-muted p-3 rounded">
                  <Typography variant="body" truncate={true}>
                    This text is too long to fit in a single line so it will be truncated with an ellipsis at the end.
                  </Typography>
                </div>
              </div>
              
              <div>
                <Typography variant="label" className="mb-1">Two Line Truncation</Typography>
                <div className="w-64 bg-muted p-3 rounded">
                  <Typography variant="body" truncate={2}>
                    This text is too long to fit in two lines so it will be truncated with an ellipsis after the second line.
                    The rest of this content will not be visible to maintain a clean layout.
                  </Typography>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <Typography variant="h4" className="mb-4">Text Emphasis</Typography>
            
            <div className="space-y-4">
              <div>
                <Typography variant="label" className="mb-1">Subtle Text</Typography>
                <Typography variant="body" className="text-subtle">
                  This text has reduced emphasis, making it ideal for secondary information.
                </Typography>
              </div>
              
              <div>
                <Typography variant="label" className="mb-1">Emphasized Text</Typography>
                <Typography variant="body" className="text-emphasis">
                  This text has increased emphasis to draw attention to important information.
                </Typography>
              </div>
              
              <div>
                <Typography variant="label" className="mb-1">Balanced Text</Typography>
                <Typography variant="body" className="text-balance">
                  This text uses the "balance" text-wrap property for better line distribution in headings and short paragraphs.
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
