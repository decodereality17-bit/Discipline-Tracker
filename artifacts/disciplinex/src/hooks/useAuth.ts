import { useState, useEffect } from "react";
import * as authFunctions from "@/lib/auth";
import { upsertProfile } from "@workspace/api-client-react";
import { Session, User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const {
          data: { session },
        } = await authFunctions.getSession();

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    getInitialSession();

    const {
      data: { subscription },
    } = authFunctions.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }

      if (event === "SIGNED_IN" && session?.user) {
        const u = session.user;
        const fullName =
          (u.user_metadata?.full_name as string | undefined) ?? "Operative";

        try {
          await upsertProfile(u.id, {
            full_name: fullName,
            email: u.email ?? "",
          });
        } catch (err) {
          console.error("Profile sync failed:", err);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    session,
    loading,
    signOut: authFunctions.signOut,
  };
}
