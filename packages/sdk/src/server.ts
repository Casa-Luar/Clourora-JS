import { createClient, type ClouroraClient, type ClouroraClientOptions } from './client';

export * from './index';

/**
 * Client for Node and other server runtimes (SSR, API routes, cron jobs, static site builds).
 * Same calls as createClient, plus an in-memory cache (default 120 s, the API's own max-age) so a busy server doesn't
 * ask Clourora once per visitor. Throws in a browser: this entry is where secret keys will go once the API has them.
 */
export function createServerClient(options: ClouroraClientOptions): ClouroraClient {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    throw new Error('@clourora/sdk/server runs on servers only; in the browser import createClient from @clourora/sdk');
  }
  return createClient({ cacheSeconds: 120, ...options });
}
