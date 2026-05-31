import { supabase } from "@/lib/supabase";

export async function sendMagicLink(email: string, fullName?: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      data: fullName ? { full_name: fullName } : undefined,
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
  return supabase.auth.onAuthStateChange(callback);
}
