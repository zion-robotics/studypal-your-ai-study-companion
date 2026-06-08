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
 * Exchanges the OAuth code for a session and forwards the user to the dashboard.
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

      // Onboarding is removed. Everyone goes straight to the dashboard now.
      nav({ to: "/dashboard" });
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
