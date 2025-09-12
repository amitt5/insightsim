import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import GoogleAnalytics from "@/components/google-analytics"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "InsightSim - AI-Powered Qualitative Research",
  description: "Simulate focus group discussions with AI personas",
  generator: 'v0.dev',
  icons: {
    icon: '/maira-favicon.png',
    shortcut: '/maira-favicon.png',
    apple: '/maira-favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <GoogleAnalytics />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}