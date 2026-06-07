import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/lib/supabase";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "StudyPal — Study smarter, even offline" },
      {
        name: "description",
        content: "AI-powered study accountability for African students who work while they study.",
      },
      { name: "author", content: "StudyPal" },
      { property: "og:title", content: "StudyPal — Study smarter, even offline" },
      {
        property: "og:description",
        content: "AI-powered study accountability for African students who work while they study.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@studypal" },
      { name: "twitter:title", content: "StudyPal — Study smarter, even offline" },
      {
        name: "twitter:description",
        content: "AI-powered study accountability for African students who work while they study.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5d1cfbbb-ac23-468a-af27-993f27bfdfb5/id-preview-ba7658d4--95520a15-4bea-4cf6-8ca6-38d83863e1c1.lovable.app-1780371328037.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5d1cfbbb-ac23-468a-af27-993f27bfdfb5/id-preview-ba7658d4--95520a15-4bea-4cf6-8ca6-38d83863e1c1.lovable.app-1780371328037.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('sp-theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}`,
          }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after a genuine OAuth/magic-link callback — when Supabase
    // puts the access_token in the URL hash. On every other page load this
    // will be false, so session-restore "SIGNED_IN" events won't redirect.
    const hasAuthHash = window.location.hash.includes("access_token");

    const routeAfterSignIn = async (
      session: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>,
    ) => {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("onboarding_completed")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname);
      }

      if (profile?.onboarding_completed) {
        router.navigate({ to: "/dashboard" });
      } else {
        router.navigate({ to: "/onboarding" });
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Guard: only redirect when we're actually handling an auth callback.
      // Without this guard, Supabase fires "SIGNED_IN" on every page load
      // when it restores the session from localStorage, which caused every
      // route to redirect back to /dashboard.
      if (event === "SIGNED_IN" && session && hasAuthHash) {
        void routeAfterSignIn(session);
      }

      void router.invalidate();
    });

    // Also handle the case where the page loads with the hash already present
    // (e.g. user lands directly on the callback URL).
    if (hasAuthHash) {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) void routeAfterSignIn(session);
      });
    }

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}