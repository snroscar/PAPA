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

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import joystickFavicon from "../assets/joystick.png";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-dawn px-4">
      <div className="w-full max-w-md rounded-[2rem] border border-primary/25 bg-glass p-8 text-center shadow-deep backdrop-blur-xl">
        <p className="font-display text-sm uppercase tracking-[0.6em] text-neon">Lost in the map</p>
        <h1 className="mt-4 text-[5rem] font-black tracking-tight text-gold-gradient">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          The destination is offline. Return to the command hub and continue the journey.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-gradient-gold px-6 py-3 text-sm font-semibold uppercase tracking-widest text-primary-foreground shadow-gold transition hover:scale-[1.02]"
          >
            Return home
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-dawn px-4">
      <div className="w-full max-w-md rounded-[2rem] border border-primary/25 bg-glass p-8 text-center shadow-deep backdrop-blur-xl">
        <p className="font-display text-sm uppercase tracking-[0.55em] text-neon">System error</p>
        <h1 className="mt-4 text-2xl font-semibold text-foreground">This page didn't load</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Something went wrong on our end. Try again or return to the main hub.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-gradient-gold px-5 py-2.5 text-sm font-semibold uppercase tracking-widest text-primary-foreground shadow-gold transition hover:scale-[1.02]"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-primary/40 bg-background/90 px-5 py-2.5 text-sm font-semibold uppercase tracking-widest text-foreground transition hover:bg-background"
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
      { title: "The General's Journey — A Birthday Adventure" },
      {
        name: "description",
        content:
          "A cinematic 3D endless-runner tribute honoring a lifetime of faithful ministry, culminating in a joyful birthday celebration.",
      },
      { name: "author", content: "The General's Journey" },
      { property: "og:title", content: "The General's Journey" },
      {
        property: "og:description",
        content:
          "Run through five seasons of a servant's life, rescue souls, and reach the Promise gate in this cinematic birthday adventure.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: joystickFavicon, type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap",
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
    <html lang="en">
      <head>
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

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
