"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserCircle } from "lucide-react"
import { useEffect, useState } from "react"

export function Navbar({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const [isVisible, setIsVisible] = useState(true)
  const [isAtTop, setIsAtTop] = useState(true)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    let scrollTimer: NodeJS.Timeout
    let lastScrollY = window.scrollY
    let lastMouseY = 0

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Check if user is at the top of the page
      const atTop = currentScrollY <= 10
      setIsAtTop(atTop)
      
      // Always show navbar while actively scrolling
      setIsVisible(true)
      
      // Clear existing timer
      clearTimeout(scrollTimer)
      
      // If not at top and not hovering, set timer to hide navbar after scrolling stops
      if (!atTop && !isHovering) {
        scrollTimer = setTimeout(() => {
          if (!isHovering) { // Double check hover state
            setIsVisible(false)
          }
        }, 500) // Hide after 0.5 seconds of no scrolling
      }
      
      lastScrollY = currentScrollY
    }

    const handleMouseMove = (e: MouseEvent) => {
      const currentMouseY = e.clientY
      
      // If mouse moves upward and is near the top of the screen, show navbar
      if (currentMouseY < lastMouseY && currentMouseY < 100) {
        setIsVisible(true)
        
        // Clear any existing hide timer
        clearTimeout(scrollTimer)
        
        // If not at top and not hovering, set timer to hide navbar
        if (!isAtTop && !isHovering) {
          scrollTimer = setTimeout(() => {
            if (!isHovering) {
              setIsVisible(false)
            }
          }, 500)
        }
      }
      
      lastMouseY = currentMouseY
    }

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    
    // Initial check
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
      clearTimeout(scrollTimer)
    }
  }, [isHovering]) // Add isHovering as dependency

  const handleMouseEnter = () => {
    setIsHovering(true)
    setIsVisible(true)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    
    // If not at top, start timer to hide navbar after leaving
    if (!isAtTop) {
      setTimeout(() => {
        if (!isHovering) {
          setIsVisible(false)
        }
      }, 500)
    }
  }

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 border-b bg-white transition-transform duration-300 ease-in-out ${
        isVisible || isAtTop ? 'translate-y-0' : '-translate-y-full'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-r from-purple-500 to-violet-600">
              <span className="text-lg font-bold text-white">IS</span>
            </div>
            <span className="text-xl font-bold">InsightSim</span>
          </Link>

          {isAuthenticated && (
            <div className="ml-10 hidden space-x-4 md:flex">
              {/* <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-primary">
                Dashboard
              </Link> */}
              <Link href="/simulations" className="text-sm font-medium text-gray-700 hover:text-primary">
                Simulations
              </Link>
              <Link href="/personas" className="text-sm font-medium text-gray-700 hover:text-primary">
                Personas
              </Link>
              {/* <Link href="/reports" className="text-sm font-medium text-gray-700 hover:text-primary">
                Reports
              </Link> */}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button variant="ghost" size="icon" className="rounded-full">
              <UserCircle className="h-6 w-6" />
            </Button>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Log In</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
