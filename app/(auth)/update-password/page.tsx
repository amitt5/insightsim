"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { useToast } from "@/hooks/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  // Check if we have a session when the page loads
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClientComponentClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      // If no session, user shouldn't be here
      if (!session) {
        toast({
          title: "Invalid access",
          description: "Please use the reset password link from your email.",
          variant: "destructive",
        })
        router.push('/login')
      }
    }
    
    checkSession()
  }, [router, toast])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      })
      return
    }
    
    try {
      setLoading(true)
      
      const supabase = createClientComponentClient()
      const { error } = await supabase.auth.updateUser({
        password: password
      })
      
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to update password",
          variant: "destructive",
        })
        return
      }
      
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated",
      })
      
      // Redirect to login page
      router.push('/login')
      
    } catch (error: any) {
      toast({
        title: "An error occurred",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-md space-y-8 px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Update Password</h1>
            <p className="mt-2 text-gray-600">
              Enter your new password below
            </p>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
} 