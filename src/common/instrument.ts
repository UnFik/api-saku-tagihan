import * as Sentry from "@sentry/bun";

// Ensure to call this before importing any other modules!
Sentry.init({
  dsn: "https://ae36d42c8b01570c2013c84b36a0cb0d@o4507124547649536.ingest.de.sentry.io/4508448287817808", // Replace with your Sentry DSN
  tracesSampleRate: 1.0, // Adjust this value for performance monitoring
});
