"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { UserCircle } from "lucide-react"
import { useEffect, useState } from "react"

interface NavbarProps {
  isAuthenticated?: boolean
}

export function Navbar({ isAuthenticated = false }: NavbarProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isAtTop, setIsAtTop] = useState(true)
  const [isHovering, setIsHovering] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)

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

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
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
        <Image
                src="/MAIRA-logo.png"
                alt="InsightSim Logo"
                width={120}
                height={48}
                priority
              />

          {isAuthenticated && (
            <div className="ml-10 hidden space-x-4 md:flex">
              {/* <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-darkTeal">
                Dashboard
              </Link> */}
              <Link href="/simulations" className="text-sm font-medium text-gray-700 hover:text-darkTeal">
                Simulations
              </Link>
              <Link href="/personas" className="text-sm font-medium text-gray-700 hover:text-darkTeal">
                Personas
              </Link>
              {/* <Link href="/reports" className="text-sm font-medium text-gray-700 hover:text-darkTeal">
                Reports
              </Link> */}
            </div>
          )}

          {/* Navigation Links for Landing Page */}
          {!isAuthenticated && (
            <div className="ml-10 hidden space-x-6 md:flex">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-sm font-medium text-gray-700 hover:text-darkTeal transition-colors"
              >
                Features
              </button>
              {/* <button 
                onClick={() => scrollToSection('demo')}
                className="text-sm font-medium text-gray-700 hover:text-darkTeal transition-colors"
              >
                Demo
              </button> */}
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-sm font-medium text-gray-700 hover:text-darkTeal transition-colors"
              >
                Pricing
              </button>
              <button 
                onClick={() => scrollToSection('faq')}
                className="text-sm font-medium text-gray-700 hover:text-darkTeal transition-colors"
              >
                FAQ
              </button>
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
