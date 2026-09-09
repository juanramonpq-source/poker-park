import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "Poker Park";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "theme-color", content: "#10263b" },
      { name: "apple-mobile-web-app-title", content: "Poker Park" },
      {
        name: "description",
        content: "Montad en las atracciones de un parque guiados por la baraja francesa. Un juego cooperativo para dos.",
      },
    ],
    links: [
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png?v=poker-park-v1" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png?v=poker-park-v1" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png?v=poker-park-v1" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png?v=poker-park" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png?v=poker-park-v1" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,600&family=Nunito:wght@400;600;700&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="es" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
