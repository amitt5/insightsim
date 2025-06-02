"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { useToast } from "@/hooks/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    company: "",
  })
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormState(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formState.email || !formState.password || !formState.firstName || !formState.lastName) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields",
        variant: "destructive",
      })
      return
    }
    
    if (formState.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }
    
    try {
      setLoading(true)
      
      // Use createClientComponentClient directly
      const supabase = createClientComponentClient()
      const response = await supabase.auth.signUp({
        email: formState.email,
        password: formState.password,
      })
      
      if (response.error) {
        toast({
          title: "Signup failed",
          description: response.error.message || "Please check your information and try again",
          variant: "destructive",
        })
        return
      }
      
      console.log("Signup response:", {
        hasUser: !!response.data.user,
        userId: response.data.user?.id,
        hasSession: !!response.data.session,
      });
      
      // Get the user ID from the auth response
      const authUserId = response.data.user?.id
      
      console.log("Auth user ID:", authUserId);
      
      if (authUserId) {
        // Create a user profile in the custom users table
        try {
          const userResponse = await fetch('/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              auth_id: authUserId,
              email: formState.email,
              first_name: formState.firstName,
              last_name: formState.lastName,
              company: formState.company || null,
              role: 'researcher',
            }),
          });
          
          if (!userResponse.ok) {
            const errorData = await userResponse.json();
            console.error('Error creating user profile:', errorData.error || 'Unknown error');
            toast({
              title: "Account created",
              description: "Your account was created, but we had an issue setting up your profile. You can complete your profile later.",
              variant: "default",
            });
          } else {
            const userData = await userResponse.json();
            console.log("User profile created:", userData);
            
            // Show success message
            toast({
              title: "Account created",
              description: "Please check your email to confirm your account",
            });
          }
          
          // Redirect to login page
          router.push("/login");
        } catch (profileError: any) {
          console.error('Error creating user profile:', profileError.message || profileError);
          
          // Still show a success message since auth account was created
          toast({
            title: "Account created",
            description: "Your account was created, but we had an issue setting up your profile. You can complete your profile later.",
            variant: "default",
          });
          
          // Redirect to simulations page
          router.push("/simulations");
        }
      } else {
        console.error('No auth user ID was returned from signup');
        toast({
          title: "Signup issue",
          description: "We couldn't complete your registration. Please try again or contact support.",
          variant: "destructive",
        });
      }
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
  
  const handleGoogleSignUp = async () => {
    try {
      setLoading(true)
      const supabase = createClientComponentClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast({
          title: "Google sign-up failed",
          description: error.message || "Please try again",
          variant: "destructive",
        })
      }
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
            <h1 className="text-3xl font-bold">Create your account</h1>
            <p className="mt-2 text-gray-600">Start simulating qualitative research with AI</p>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input 
                    id="firstName" 
                    name="firstName"
                    value={formState.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input 
                    id="lastName" 
                    name="lastName"
                    value={formState.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

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
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  name="password"
                  type="password" 
                  value={formState.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company (optional)</Label>
                <Input 
                  id="company" 
                  name="company"
                  value={formState.company}
                  onChange={handleInputChange}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
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
                className="mt-4 w-full"
                onClick={handleGoogleSignUp}
                disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
                Sign up with Google
              </Button>
            </div>

            <p className="mt-4 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
