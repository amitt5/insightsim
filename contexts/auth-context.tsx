"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

// Define the Auth context types
type User = {
  id: string;
  email?: string;
  role?: string;
  first_name?: string;
  last_name?: string;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  signOut: () => Promise<void>;
};

// Create the Auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider props
type AuthProviderProps = {
  children: ReactNode;
};

// Create the Auth provider
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Check for user on initial load
  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Fetch additional user data from the users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (userError) {
            console.error("Error fetching user data:", userError);
          }

          setUser({
            id: session.user.id,
            email: session.user.email,
            role: userData?.role,
            first_name: userData?.first_name,
            last_name: userData?.last_name,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Unexpected error loading user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Fetch additional user data from the users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (userError) {
            console.error("Error fetching user data:", userError);
          }

          setUser({
            id: session.user.id,
            email: session.user.email,
            role: userData?.role,
            first_name: userData?.first_name,
            last_name: userData?.last_name,
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // Sign out method using the server-side route
  async function signOut() {
    try {
      // Call the server route for sign out
      await fetch('/auth/sign-out', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  const value = {
    user,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
} 