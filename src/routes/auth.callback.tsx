import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({ meta: [{ title: "Signing you in… — StudyPal" }] }),
  component: AuthCallback,
});

/**
 * Supabase redirects here after Google OAuth.
 * The URL will contain either:
 *   - A `code` query param (PKCE flow) — exchanged for a session automatically by the Supabase client
 *   - An `error` query param — something went wrong on Google's side
 *
 * After the session is established we check onboarding status and forward the user.
 */
function AuthCallback() {
  const nav = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      // Check for OAuth error from Google
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get("error");
      const oauthErrorDesc = params.get("error_description");

      if (oauthError) {
        console.error("OAuth error:", oauthError, oauthErrorDesc);
        nav({ to: "/login", search: { error: oauthError } });
        return;
      }

      // The Supabase client automatically exchanges the `code` param for a session.
      // We just need to wait for the session to be ready.
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error("Session error:", sessionError);
        nav({ to: "/login" });
        return;
      }

      // Check whether this user has completed onboarding
      const userId = session.user.id;
      let onboarded = false;

      try {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("onboarding_completed")
          .eq("user_id", userId)
          .maybeSingle();

        onboarded =
          profile?.onboarding_completed ??
          (session.user?.user_metadata as any)?.onboarding_completed ??
          false;
      } catch {
        // If the profile lookup fails, send them to onboarding — safer default
        onboarded = false;
      }

      nav({ to: onboarded ? "/dashboard" : "/onboarding" });
    }

    handleCallback();
  }, [nav]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
      <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
        Signing you in…
      </p>
    </div>
  );
}
