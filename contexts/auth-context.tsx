"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  getCurrentUser, 
  signIn as supabaseSignIn, 
  signUp as supabaseSignUp, 
  signOut as supabaseSignOut,
  resetPassword as supabaseResetPassword,
  supabase
} from '@/lib/supabase';

// Define the Auth context types
type User = {
  id: string;
  email?: string;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
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

  // Check for user on initial load
  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        const { user: currentUser, error } = await getCurrentUser();
        
        if (currentUser) {
          setUser({
            id: currentUser.id,
            email: currentUser.email,
          });
        } else {
          setUser(null);
        }
        
        if (error) {
          console.error("Error loading user:", error);
        }
      } catch (error) {
        console.error("Unexpected error loading user:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session && session.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
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
  }, []);

  // Wrap the provider methods
  async function signIn(email: string, password: string) {
    const { data, error } = await supabaseSignIn(email, password);
    return { error };
  }

  async function signUp(email: string, password: string) {
    const { data, error } = await supabaseSignUp(email, password);
    return { error };
  }

  async function signOut() {
    const { error } = await supabaseSignOut();
    return { error };
  }

  async function resetPassword(email: string) {
    const { data, error } = await supabaseResetPassword(email);
    return { error };
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
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