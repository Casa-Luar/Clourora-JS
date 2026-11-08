import { describe, expect, it, vi } from 'vitest';
import { ClouroraError, createClient, formatPetAge } from '../src';
import { createServerClient } from '../src/server';
import { json, pet } from './fixtures';

function setup(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const fetch = vi.fn(async (url: string, init: RequestInit) => handler(url, init));
  return { fetch, client: createClient({ apiKey: 'ck_pub_test', baseUrl: 'https://api.test/', fetch }) };
}

describe('createClient', () => {
  it('requires an api key', () => {
    expect(() => createClient({ apiKey: '' })).toThrow(ClouroraError);
  });

  it('lists pets from the v1 path with the key header and query', async () => {
    const { fetch, client } = setup(() => json({ location: { name: 'Baja' }, lang: 'en', pets: [pet()] }));
    const list = await client.adoptions.list({ lang: 'en', status: ['available', 'reserved'], species: 'dog' });

    expect(list.pets[0]!.name).toBe('Canela');
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe('https://api.test/publicapi/v1/adoption/pets?lang=en&status=available%2Creserved&species=dog');
    expect((init.headers as Record<string, string>)['X-Api-Key']).toBe('ck_pub_test');
  });

  it('uses the default language when none is given', async () => {
    const { fetch, client } = setup(() => json({ location: { name: null }, lang: 'es', pets: [] }));
    await client.adoptions.list();
    expect(fetch.mock.calls[0]![0]).toBe('https://api.test/publicapi/v1/adoption/pets?lang=es');
  });

  it('maps API errors to ClouroraError codes', async () => {
    const { client } = setup(() => json({ error: 'origin_not_allowed' }, 403));
    await expect(client.adoptions.list()).rejects.toMatchObject({ code: 'origin_not_allowed', status: 403 });
  });

  it('turns a missing body into http_error / rate_limited by status', async () => {
    const { client } = setup(() => new Response('<html>', { status: 429 }));
    await expect(client.adoptions.list()).rejects.toMatchObject({ code: 'rate_limited', status: 429 });
  });

  it('wraps network failures', async () => {
    const { client } = setup(() => {
      throw new TypeError('Failed to fetch');
    });
    await expect(client.adoptions.list()).rejects.toMatchObject({ code: 'network_error', status: 0 });
  });

  it('get returns null for unpublished pets and invalid ids', async () => {
    const { fetch, client } = setup(() => json({ error: 'not_found' }, 404));
    expect(await client.adoptions.get(99)).toBeNull();
    expect(await client.adoptions.get(-1)).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('listInLanguages merges texts per pet', async () => {
    const { client } = setup(url => {
      const lang = new URL(url).searchParams.get('lang');
      return json({
        location: { name: 'Baja' },
        lang,
        pets: [pet(lang === 'en' ? { bio: 'Playful', traits: ['calm'], species: 'Dog' } : {})]
      });
    });
    const { pets } = await client.adoptions.listInLanguages(['es', 'en', 'es']);
    expect(pets).toHaveLength(1);
    expect(pets[0]!.bio).toBe('Juguetona');
    expect(pets[0]!.texts.en).toEqual({ bio: 'Playful', traits: ['calm'], species: 'Dog', breed: 'Mestizo' });
    expect(Object.keys(pets[0]!.texts)).toEqual(['es', 'en']);
  });

  it('caches responses only when cacheSeconds is set', async () => {
    const fetch = vi.fn(async () => json({ location: { name: null }, lang: 'es', pets: [] }));
    const cached = createClient({ apiKey: 'k', fetch, cacheSeconds: 60 });
    await cached.adoptions.list();
    await cached.adoptions.list();
    expect(fetch).toHaveBeenCalledTimes(1);
    cached.clearCache();
    await cached.adoptions.list();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not keep failed responses in the cache', async () => {
    let fail = true;
    const fetch = vi.fn(async () =>
      fail ? json({ error: 'module_off' }, 403) : json({ location: { name: null }, lang: 'es', pets: [] })
    );
    const cached = createClient({ apiKey: 'k', fetch, cacheSeconds: 60 });
    await expect(cached.adoptions.list()).rejects.toBeInstanceOf(ClouroraError);
    fail = false;
    await expect(cached.adoptions.list()).resolves.toMatchObject({ pets: [] });
  });
});

describe('createServerClient', () => {
  it('caches for 120 s by default', async () => {
    const fetch = vi.fn(async () => json({ location: { name: null }, lang: 'es', pets: [] }));
    const client = createServerClient({ apiKey: 'k', fetch });
    await client.adoptions.list();
    await client.adoptions.list();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('formatPetAge', () => {
  it.each([
    [null, 'es', ''],
    [0, 'es', '1 mes'],
    [5, 'en', '5 months'],
    [12, 'es', '1 año'],
    [30, 'fr', '2 ans'],
    [13, 'en', '1 year']
  ] as const)('%s months in %s → %s', (months, lang, expected) => {
    expect(formatPetAge(months, lang)).toBe(expected);
  });
});
