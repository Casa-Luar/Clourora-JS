import { HttpClient } from '@angular/common/http';
import { InjectionToken, inject, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { createClient, type ClouroraClient, type ClouroraClientOptions } from '@clourora/sdk';
import { httpClientFetch } from './http-client-fetch';

export interface ClouroraAngularOptions extends Omit<ClouroraClientOptions, 'fetch'> {
  /**
   * Send requests with the app's HttpClient (default true): its interceptors run, SSR waits for them and reuses the
   * responses on hydration (with provideClientHydration's HTTP transfer cache). False uses the global fetch.
   */
  useHttpClient?: boolean;
}

export const CLOURORA_CLIENT = new InjectionToken<ClouroraClient>('CLOURORA_CLIENT');

/** `bootstrapApplication(App, { providers: [provideHttpClient(withFetch()), provideClourora({ apiKey })] })` */
export function provideClourora(options: ClouroraAngularOptions): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: CLOURORA_CLIENT,
      useFactory: () => {
        const { useHttpClient = true, ...clientOptions } = options;
        const http = useHttpClient ? inject(HttpClient, { optional: true }) : null;
        return createClient({ ...clientOptions, fetch: http ? httpClientFetch(http) : undefined });
      }
    }
  ]);
}

/** The client provideClourora() made, for calls outside resources (event handlers, guards, resolvers). */
export function injectClourora(): ClouroraClient {
  const client = inject(CLOURORA_CLIENT, { optional: true });
  if (!client) {
    throw new Error('@clourora/angular: add provideClourora({ apiKey }) to the application providers');
  }
  return client;
}
