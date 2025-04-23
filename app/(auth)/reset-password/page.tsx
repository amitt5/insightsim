"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { useToast } from "@/hooks/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function ResetPasswordPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast({
        title: "Missing information",
        description: "Please enter your email address",
        variant: "destructive",
      })
      return
    }
    
    try {
      setLoading(true)
      
      const supabase = createClientComponentClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })
      
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to send reset password email",
          variant: "destructive",
        })
        return
      }
      
      setSubmitted(true)
      toast({
        title: "Email sent",
        description: "Check your email for the password reset link",
      })
      
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
            <h1 className="text-3xl font-bold">Reset Password</h1>
            <p className="mt-2 text-gray-600">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>

          {submitted ? (
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-center">Check your email</h2>
              <p className="mt-2 text-center text-gray-600">
                We've sent you instructions on how to reset your password. Check your spam folder if you don't see the email.
              </p>
              <div className="mt-6 text-center">
                <Link href="/login" className="text-primary hover:underline">
                  Return to login
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Instructions"}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                <Link href="/login" className="text-primary hover:underline">
                  Back to login
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 