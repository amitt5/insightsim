"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { useToast } from "@/hooks/use-toast"
import { createClientComponentClient, User, Session } from "@supabase/auth-helpers-nextjs"
import { logErrorNonBlocking } from "@/utils/errorLogger"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formState, setFormState] = useState({
    email: "",
    password: "",
  })
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormState(prev => ({ ...prev, [name]: value }))
  }
  
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      const supabase = createClientComponentClient()
      
      // Create auth state change listener before initiating sign in
      let authStateResolver: any = null
      let authStateRejector: any = null
      
      type AuthStateResult = {
        data: { session: Session | null; user: User | null } | null;
        error: Error | null;
      }
      
      const authStatePromise = new Promise<AuthStateResult>((resolve, reject) => {
        authStateResolver = resolve
        authStateRejector = reject
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log("🔄 Google Auth state changed:", event, !!session)
          
          if (event === 'SIGNED_IN' && session) {
            console.log("✅ Google Auth state: SIGNED_IN detected")
            subscription.unsubscribe()
            resolve({ data: { session, user: session.user }, error: null })
          }
        })
        
        // Clean up subscription after 15 seconds
        setTimeout(() => {
          subscription.unsubscribe()
          reject(new Error('Authentication timeout'))
        }, 15000)
      })
      
      // Initiate Google sign in
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })
      
      if (signInError) {
        console.error('Google signin error:', signInError)
        
        // Log the error
        logErrorNonBlocking(
          'google_signin',
          signInError,
          undefined,
          { 
            provider: 'google',
            redirect_to: `${window.location.origin}/auth/callback`
          }
        )
        
        toast({
          title: "Google signin failed",
          description: signInError.message,
          variant: "destructive",
        })
        return
      }
      
      // Wait for auth state to change
      const result = await authStatePromise
      
      if (result.error) {
        console.log("❌ Google Login error:", result.error.message)
        
        logErrorNonBlocking(
          'google_auth_state_error',
          result.error,
          undefined,
          { 
            error_type: result.error.message.includes('timeout') ? 'timeout' : 'auth_error'
          }
        )
        
        toast({
          title: "Login failed",
          description: result.error.message || "Please try again",
          variant: "destructive",
        })
        return
      }
      
      console.log("✅ Google Login success via auth state change!")
      
      // Small delay to ensure session is fully established
      await new Promise(resolve => setTimeout(resolve, 100))
      
      console.log("🔄 About to redirect to /simulations...")
      router.push("/projects")
      
    } catch (error: any) {
      console.log("💥 Google signin catch block error:", error.message)
      
      logErrorNonBlocking(
        'google_signin_catch_error',
        error,
        undefined,
        { 
          error_type: error.message.includes('timeout') ? 'timeout' : 'unexpected_error'
        }
      )
      
      toast({
        title: "An error occurred",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formState.email || !formState.password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      })
      return
    }
    
    try {
      setLoading(true)
      const supabase = createClientComponentClient()
      
      console.log("🚪 Calling signInWithPassword...")
      
      // Create auth state change listener
      let authStateResolver: any = null
      let authStateRejector: any = null
      
      type AuthStateResult = {
        data: { session: Session | null; user: User | null } | null;
        error: Error | null;
      }
      
      const authStatePromise = new Promise<AuthStateResult>((resolve, reject) => {
        authStateResolver = resolve
        authStateRejector = reject
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log("🔄 Auth state changed:", event, !!session)
          
          if (event === 'SIGNED_IN' && session) {
            console.log("✅ Auth state: SIGNED_IN detected")
            subscription.unsubscribe()
            resolve({ data: { session, user: session.user }, error: null })
          }
        })
        
        // Clean up subscription after 15 seconds
        setTimeout(() => {
          subscription.unsubscribe()
          reject(new Error('Authentication timeout'))
        }, 15000)
      })
      
      // Start the login process and handle immediate errors
      const signInPromise = supabase.auth.signInWithPassword({
        email: formState.email,
        password: formState.password,
      })
      
      // Handle the signIn response for immediate errors (like invalid credentials)
      signInPromise.then(response => {
        if (response.error) {
          console.log("❌ SignIn immediate error:", response.error.message)
          // Cancel the auth state listener
          if (authStateRejector) {
            authStateRejector(response.error)
          }
        }
      }).catch(error => {
        console.log("❌ SignIn promise error:", error)
        if (authStateRejector) {
          authStateRejector(error)
        }
      })
      
      // Wait for either auth state change or immediate error
      const result = await authStatePromise
      
      if (result.error) {
        console.log("❌ Login error:", result.error.message)
        
        // Log the authentication error
        logErrorNonBlocking(
          'email_password_login',
          result.error,
          undefined,
          { 
            email: formState.email,
            error_type: result.error.message === "Invalid login credentials" ? "invalid_credentials" : "auth_error"
          }
        )
        
        // Handle specific error types
        if (result.error.message === "Invalid login credentials") {
          toast({
            title: "Invalid credentials",
            description: "The email or password you entered is incorrect. Please try again.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Login failed",
            description: result.error.message || "Please check your credentials and try again",
            variant: "destructive",
          })
        }
        return
      }
      
      console.log("✅ Login success via auth state change!")
      
      // Small delay to ensure session is fully established
      await new Promise(resolve => setTimeout(resolve, 100))
      
      console.log("🔄 About to redirect to /simulations...")
      router.push("/projects")
      
    } catch (error: any) {
      console.log("💥 Catch block error:", error.message)
      
      // Log the catch block error
      logErrorNonBlocking(
        'login_catch_error',
        error,
        undefined,
        { 
          email: formState.email,
          error_type: error.message.includes('timeout') ? 'timeout' : 'unexpected_error'
        }
      )
      
      // Handle specific error types in catch block too
      if (error.message === "Invalid login credentials") {
        toast({
          title: "Invalid credentials",
          description: "The email or password you entered is incorrect. Please try again.",
          variant: "destructive",
        })
      } else if (error.message.includes('timeout')) {
        toast({
          title: "Login timeout",
          description: "Login is taking too long. Please check your connection and try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "An error occurred",
          description: error.message || "Something went wrong. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      console.log("🏁 Finally block - setting loading to false")
      setLoading(false)
    }
  }
  
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-md space-y-8 px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="mt-2 text-gray-600">Sign in to your InsightSim account</p>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email"
                  type="email" 
                  placeholder="you@example.com" 
                  value={formState.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/reset-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  name="password"
                  type="password" 
                  value={formState.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg
                className="mr-2 h-4 w-4"
                aria-hidden="true"
                focusable="false"
                data-prefix="fab"
                data-icon="google"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                ></path>
              </svg>
              Sign in with Google
            </Button>

            <div className="mt-4 text-center text-sm">
              <span className="text-gray-600">Don't have an account?</span>{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
