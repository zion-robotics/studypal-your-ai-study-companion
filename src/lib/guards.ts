import { redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

export async function requireAuth() {
  if (typeof window === "undefined") return;
  // Email confirmation redirects include a Supabase token in the hash.
  // Let the root auth listener exchange it before deciding the user is signed out.
  if (window.location.hash.includes("access_token")) return;

  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    throw redirect({ to: "/login" });
  }
}

export async function requireGuest() {
  if (typeof window === "undefined") return;
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return;
  // logged in — check onboarding status
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("onboarding_completed")
    .eq("user_id", session.user.id)
    .maybeSingle();
  const completed =
    profile?.onboarding_completed ??
    (session.user.user_metadata as any)?.onboarding_completed ??
    false;
  if (completed) throw redirect({ to: "/dashboard" });
  throw redirect({ to: "/onboarding" });
}
