import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserCircle } from "lucide-react"

export function Navbar({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  return (
    <nav className="border-b bg-white">
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
