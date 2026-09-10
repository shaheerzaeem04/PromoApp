/** Frontend fatal-error hook. External APM is not initialized unless VITE_SENTRY_DSN is set. */
const SENSITIVE = /password|token|authorization|jwt|secret|apikey|session/i;

export function captureFrontendException(error: unknown, meta?: Record<string, unknown>): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  const safeMeta: Record<string, unknown> = {};
  if (meta) {
    for (const [key, value] of Object.entries(meta)) {
      safeMeta[key] = SENSITIVE.test(key) ? '[redacted]' : value;
    }
  }
  if (!dsn) {
    console.error('frontend.fatal', error instanceof Error ? error.message : String(error), safeMeta);
    return;
  }
  console.error('frontend.fatal', error instanceof Error ? error.message : String(error), safeMeta);
}
