import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? "development",
  tracesSampleRate:         0.1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.01,
  integrations: [
    Sentry.replayIntegration({
      maskAllText:   false,
      blockAllMedia: false,
    }),
  ],
  // Ne pas tracker les erreurs réseau attendues (connexions africaines instables)
  ignoreErrors: [
    "NetworkError",
    "Failed to fetch",
    "Load failed",
    "AbortError",
  ],
});
