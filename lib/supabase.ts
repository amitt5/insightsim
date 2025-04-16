import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Use the NextJS auth helpers for client components
export const supabase = createClientComponentClient({
  supabaseUrl,
  supabaseKey: supabaseAnonKey,
});

// Authentication helper functions
export async function signUp(email: string, password: string) {
  const response = await supabase.auth.signUp({
    email,
    password,
  });
  
  console.log("Supabase signUp response:", JSON.stringify({
    user: response.data.user,
    error: response.error
  }));
  
  return response;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  console.log("Sign in response:", JSON.stringify({
    session: data?.session ? "Session exists" : "No session",
    user: data?.user ? "User exists" : "No user",
    error: error
  }));
  
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  return { data, error };
}

export async function getCurrentUser() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return { user: null, error };
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  
  return { user, error: null };
} 