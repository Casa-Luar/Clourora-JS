import { HttpClient, HttpErrorResponse, HttpHeaders, type HttpResponse } from '@angular/common/http';

/**
 * A fetch() made of HttpClient, so @clourora/sdk calls go through the app's interceptors, count as pending work for SSR
 * and land in the HTTP transfer cache (no second request on hydration).
 */
export function httpClientFetch(http: HttpClient): (input: string, init: RequestInit) => Promise<Response> {
  return (input, init) =>
    new Promise<Response>((resolve, reject) => {
      const signal = init.signal;
      if (signal?.aborted) {
        reject(abortError());
        return;
      }
      const headers = new HttpHeaders(toRecord(init.headers));
      const subscription = http
        .request(init.method ?? 'GET', input, { headers, observe: 'response', responseType: 'text' })
        .subscribe({
          next: (response: HttpResponse<string>) =>
            resolve(toResponse(response.body, response.status, response.headers)),
          error: (error: unknown) => {
            if (error instanceof HttpErrorResponse && error.status > 0) {
              const body = typeof error.error === 'string' ? error.error : JSON.stringify(error.error ?? null);
              resolve(toResponse(body, error.status, error.headers));
            } else {
              reject(error instanceof HttpErrorResponse ? new TypeError(error.message) : error);
            }
          }
        });
      signal?.addEventListener(
        'abort',
        () => {
          subscription.unsubscribe();
          reject(abortError());
        },
        { once: true }
      );
    });
}

function toRecord(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return headers as Record<string, string>;
}

function toResponse(body: string | null, status: number, headers: HttpHeaders): Response {
  const out = new Headers();
  for (const key of headers.keys()) out.set(key, headers.get(key) ?? '');
  return new Response(status === 204 || status === 304 ? null : (body ?? ''), { status, headers: out });
}

function abortError(): Error {
  return typeof DOMException === 'function' ? new DOMException('Aborted', 'AbortError') : new Error('Aborted');
}
