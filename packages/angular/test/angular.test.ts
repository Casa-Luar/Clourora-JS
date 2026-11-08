import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, Injector, provideZonelessChangeDetection, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ClouroraError } from '@clourora/sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { adoptionPetResource, adoptionsResource, injectClourora, provideClourora } from '../src';

const BASE = 'https://api.test';
const list = (lang: string) => ({ location: { name: 'Baja' }, lang, pets: [{ id: 1, name: 'Canela' }] });

function configure(useHttpClient = true) {
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideClourora({ apiKey: 'ck_pub_test', baseUrl: BASE, useHttpClient })
    ]
  });
}

async function settle() {
  await TestBed.inject(ApplicationRef).whenStable();
}

/** Flushes pending HttpClient requests once the resource has issued them */
async function flush(url: string, body: object, status = 200) {
  await new Promise(r => setTimeout(r));
  const req = TestBed.inject(HttpTestingController).expectOne(url);
  expect(req.request.headers.get('X-Api-Key')).toBe('ck_pub_test');
  req.flush(body, { status, statusText: status === 200 ? 'OK' : 'Error' });
}

afterEach(() => {
  TestBed.resetTestingModule();
  vi.unstubAllGlobals();
});

describe('@clourora/angular', () => {
  it('injectClourora explains a missing provider', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    expect(() => TestBed.runInInjectionContext(() => injectClourora())).toThrow(/provideClourora/);
  });

  it('adoptionsResource goes through HttpClient and re-fetches when its signal changes', async () => {
    configure();
    const lang = signal<'es' | 'en'>('es');
    const pets = TestBed.runInInjectionContext(() => adoptionsResource(() => ({ lang: lang() })));

    await flush(`${BASE}/publicapi/v1/adoption/pets?lang=es`, list('es'));
    await settle();
    expect(pets.value()?.lang).toBe('es');

    lang.set('en');
    await flush(`${BASE}/publicapi/v1/adoption/pets?lang=en`, list('en'));
    await settle();
    expect(pets.value()?.lang).toBe('en');
    TestBed.inject(HttpTestingController).verify();
  });

  it('surfaces API errors as ClouroraError on the resource', async () => {
    configure();
    const pets = TestBed.runInInjectionContext(() => adoptionsResource());
    await flush(`${BASE}/publicapi/v1/adoption/pets?lang=es`, { error: 'origin_not_allowed' }, 403);
    await settle();
    expect(pets.error()).toBeInstanceOf(ClouroraError);
    expect((pets.error() as ClouroraError).code).toBe('origin_not_allowed');
  });

  it('adoptionPetResource waits while params are undefined and gives null for unpublished pets', async () => {
    configure();
    const id = signal<number | undefined>(undefined);
    const pet = TestBed.runInInjectionContext(() => adoptionPetResource(() => (id() ? { id: id()! } : undefined)));
    await settle();
    TestBed.inject(HttpTestingController).expectNone(() => true);
    expect(pet.status()).toBe('idle');

    id.set(5);
    await flush(`${BASE}/publicapi/v1/adoption/pets/5?lang=es`, { error: 'not_found' }, 404);
    await settle();
    expect(pet.value()).toBeNull();
  });

  it('uses the global fetch with useHttpClient: false', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(list('es')), { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    configure(false);
    const injector = TestBed.inject(Injector);
    const pets = runInInjectionContext(injector, () => adoptionsResource());
    await vi.waitFor(() => expect(pets.value()?.pets).toHaveLength(1));
    expect(fetch).toHaveBeenCalledOnce();
    TestBed.inject(HttpTestingController).verify();
  });
});
