import { ClouroraError } from './errors';
import type {
  AdoptionGetParams,
  AdoptionList,
  AdoptionListParams,
  AdoptionPet,
  Lang,
  LocalizedAdoptionPet,
  ClouroraErrorCode
} from './types';

export const DEFAULT_BASE_URL = 'https://api.clourora.com';
export const API_VERSION = 'v1';

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export interface ClouroraClientOptions {
  /** A publishable key (ck_pub_…) from Clourora: My Business → Negocio → Pet adoption */
  apiKey: string;
  /** Default https://api.clourora.com */
  baseUrl?: string;
  /** Language used when a call doesn't pass one. Default 'es' */
  lang?: Lang;
  /** Custom fetch (tests, proxies, Angular's HttpClient through @clourora/angular). Default: globalThis.fetch */
  fetch?: FetchLike;
  /**
   * Keep successful GET responses in memory for this many seconds. Off (0) by default in browsers, where the HTTP cache
   * already honours the API's Cache-Control; @clourora/sdk/server turns it on.
   */
  cacheSeconds?: number;
  /** Extra headers sent on every request */
  headers?: Record<string, string>;
}

export interface ClouroraClient {
  readonly adoptions: AdoptionsApi;
  /** Drops every cached response (only matters with cacheSeconds) */
  clearCache(): void;
}

export interface AdoptionsApi {
  /** Pets the key's location published: available first, then reserved, in the order the business set. */
  list(params?: AdoptionListParams): Promise<AdoptionList>;
  /** One published pet, or null when it isn't published (any more). */
  get(id: number, params?: AdoptionGetParams): Promise<AdoptionPet | null>;
  /**
   * The list in several languages at once (one request per language, in parallel), merged by pet: the fields come from
   * the first language and `texts` holds bio/traits/species/breed per language. For sites with a language switcher.
   */
  listInLanguages(
    langs: readonly Lang[],
    params?: Omit<AdoptionListParams, 'lang'>
  ): Promise<{ location: AdoptionList['location']; pets: LocalizedAdoptionPet[] }>;
}

export function createClient(options: ClouroraClientOptions): ClouroraClient {
  if (!options?.apiKey) {
    throw new ClouroraError('invalid_key', 0, 'createClient: apiKey is required');
  }
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
  const defaultLang: Lang = options.lang ?? 'es';
  const fetchFn: FetchLike | undefined =
    options.fetch ?? (globalThis.fetch ? globalThis.fetch.bind(globalThis) : undefined);
  if (!fetchFn) {
    throw new ClouroraError('network_error', 0, 'createClient: no fetch available; pass options.fetch');
  }
  const cacheMs = Math.max(0, options.cacheSeconds ?? 0) * 1000;
  const cache = new Map<string, { expires: number; value: Promise<unknown> }>();

  async function request<T>(path: string, query: Record<string, string | undefined>, signal?: AbortSignal): Promise<T> {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') search.set(key, value);
    }
    const qs = search.toString();
    const url = `${baseUrl}/publicapi/${API_VERSION}${path}${qs ? `?${qs}` : ''}`;

    if (cacheMs) {
      const hit = cache.get(url);
      if (hit && hit.expires > Date.now()) return hit.value as Promise<T>;
    }
    const value = send<T>(url, signal);
    if (cacheMs) {
      cache.set(url, { expires: Date.now() + cacheMs, value });
      // A failed call isn't kept
      value.catch(() => cache.delete(url));
    }
    return value;
  }

  async function send<T>(url: string, signal?: AbortSignal): Promise<T> {
    let response: Response;
    try {
      response = await fetchFn!(url, {
        method: 'GET',
        headers: { Accept: 'application/json', ...options.headers, 'X-Api-Key': options.apiKey },
        signal
      });
    } catch (cause) {
      if (signal?.aborted) throw cause;
      throw new ClouroraError('network_error', 0, `Clourora API unreachable: ${String(cause)}`, { cause });
    }
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      if (response.ok)
        throw new ClouroraError('invalid_response', response.status, 'Clourora API answered without JSON');
    }
    if (!response.ok) {
      const code = (body as { error?: string } | null)?.error;
      throw new ClouroraError(errorCode(code, response.status), response.status);
    }
    return body as T;
  }

  const adoptions: AdoptionsApi = {
    list(params = {}) {
      const status = Array.isArray(params.status) ? params.status.join(',') : params.status;
      return request<AdoptionList>(
        '/adoption/pets',
        { lang: params.lang ?? defaultLang, status, species: params.species?.toString() },
        params.signal
      );
    },

    async get(id, params = {}) {
      if (!Number.isInteger(id) || id <= 0) return null;
      try {
        return await request<AdoptionPet>(`/adoption/pets/${id}`, { lang: params.lang ?? defaultLang }, params.signal);
      } catch (error) {
        if (error instanceof ClouroraError && error.code === 'not_found') return null;
        throw error;
      }
    },

    async listInLanguages(langs, params = {}) {
      const unique = [...new Set(langs.length ? langs : [defaultLang])];
      const lists = await Promise.all(unique.map(lang => adoptions.list({ ...params, lang })));
      const [first] = lists;
      const byLang = lists.map(list => new Map(list.pets.map(pet => [pet.id, pet])));
      return {
        location: first!.location,
        pets: first!.pets.map(pet => {
          const texts: LocalizedAdoptionPet['texts'] = {};
          unique.forEach((lang, i) => {
            const other = byLang[i]!.get(pet.id) ?? pet;
            texts[lang] = { bio: other.bio, traits: other.traits, species: other.species, breed: other.breed };
          });
          return { ...pet, texts };
        })
      };
    }
  };

  return { adoptions, clearCache: () => cache.clear() };
}

const KNOWN: readonly ClouroraErrorCode[] = [
  'invalid_key',
  'origin_not_allowed',
  'scope_not_allowed',
  'module_off',
  'not_found'
];

function errorCode(code: string | undefined, status: number): ClouroraErrorCode {
  if (code && (KNOWN as readonly string[]).includes(code)) return code as ClouroraErrorCode;
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate_limited';
  if (status === 401) return 'invalid_key';
  return 'http_error';
}
