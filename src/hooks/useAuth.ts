import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  university: string | null;
  course_of_study: string | null;
  year_of_study: string | null;
}

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

export function useAuth(): AuthState & { signOut: () => Promise<void> } {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    // Load initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadProfile(session);
      } else {
        setState({ session: null, user: null, profile: null, loading: false });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          loadProfile(session);
        } else {
          setState({ session: null, user: null, profile: null, loading: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(session: Session) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select(
        "full_name, avatar_url, onboarding_completed, university, course_of_study, year_of_study"
      )
      .eq("user_id", session.user.id)
      .maybeSingle();

    setState({
      session,
      user: session.user,
      profile: profile ?? null,
      loading: false,
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { ...state, signOut };
}

/** Returns a display name, preferring profile > user_metadata > email prefix */
export function getDisplayName(
  profile: UserProfile | null,
  user: User | null
): string {
  if (profile?.full_name) return profile.full_name;
  const meta = user?.user_metadata as any;
  if (meta?.full_name) return meta.full_name;
  if (user?.email) return user.email.split("@")[0];
  return "Student";
}

/** Returns the first name only */
export function getFirstName(
  profile: UserProfile | null,
  user: User | null
): string {
  return getDisplayName(profile, user).split(" ")[0];
}

/** Returns initials (up to 2 letters) for an avatar placeholder */
export function getInitials(
  profile: UserProfile | null,
  user: User | null
): string {
  const name = getDisplayName(profile, user);
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "S";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
