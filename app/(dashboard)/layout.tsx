"use client"
import type React from "react"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleUpgrade = async () => {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
    });

    if (!res.ok) {
      alert('Failed to create checkout session');
      return;
    }

    const data = await res.json();
    router.push(data.url); // redirect to Stripe Checkout
  };


  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation - hidden on mobile */}
      <div className="hidden lg:block lg:w-64 lg:fixed lg:inset-y-0 lg:border-r bg-background">
        <div className="flex flex-col h-full py-4">
          <div className="px-6 py-2">
            <h2 className="text-xl font-bold">InsightSim</h2>
          </div>
          <nav className="flex-1 space-y-2 px-4 mt-4">
            <Link 
              href="/simulations"
              className="flex items-center px-4 py-2 text-sm font-medium rounded-lg hover:bg-accent"
            >
              Simulations
            </Link>
            <Link 
              href="/personas"
              className="flex items-center px-4 py-2 text-sm font-medium rounded-lg hover:bg-accent"
            >
              Personas
            </Link>
            <Link 
              href="/calibration"
              className="flex items-center px-4 py-2 text-sm font-medium rounded-lg hover:bg-accent"
            >
              Calibration
            </Link>
            <Link 
              href="/settings"
              className="flex items-center px-4 py-2 text-sm font-medium rounded-lg hover:bg-accent"
            >
              Settings
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header with Menu */}
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          {/* Logo - only visible on mobile */}
          <div className="lg:hidden">
            <h2 className="text-xl font-bold">InsightSim</h2>
          </div>
          
          {/* Menu Button - visible on all screens */}
          <div className="ml-auto">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                  <nav className="space-y-2">
                    {/* User section - visible on all screens */}
                    <div className="px-4 py-2">
                      <div className="text-sm text-gray-500">Signed in as</div>
                      <div className="text-sm font-medium">
                        {user?.email} {user?.role && `(${user.role})`}
                      </div>
                    </div>
                    {/* {user?.role === 'admin' && ( */}
                    <button
                      onClick={handleUpgrade}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Upgrade to Premium
                    </button>
                    {/* )} */}
                    {/* Mobile-only navigation links */}
                    <div className="lg:hidden">
                      <Link 
                        href="/simulations"
                        className="flex items-center px-4 py-2 text-sm font-medium rounded-lg hover:bg-accent"
                      >
                        Simulations
                      </Link>
                      <Link 
                        href="/personas"
                        className="flex items-center px-4 py-2 text-sm font-medium rounded-lg hover:bg-accent"
                      >
                        Personas
                      </Link>
                      <Link 
                        href="/calibration"
                        className="flex items-center px-4 py-2 text-sm font-medium rounded-lg hover:bg-accent"
                      >
                        Calibration
                      </Link>
                      <Link 
                        href="/settings"
                        className="flex items-center px-4 py-2 text-sm font-medium rounded-lg hover:bg-accent"
                      >
                        Settings
                      </Link>
                    </div>

                    {/* Logout button - visible on all screens */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Log out
                    </button>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
