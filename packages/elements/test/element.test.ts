import type { AdoptionPet } from '@clourora/sdk';
import { createClient } from '@clourora/sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src';
import type { ClouroraAdoptionsElement } from '../src';

const pet = (overrides: Partial<AdoptionPet> = {}): AdoptionPet => ({
  id: 7,
  name: 'Canela',
  status: 'available',
  species: 'Perro',
  breed: 'Mestizo',
  sex: 'female',
  age_months: 26,
  birth_month: '2024-09',
  size: 'medium',
  color: null,
  sterilized: true,
  vaccinated: false,
  good_with_kids: true,
  good_with_dogs: null,
  good_with_cats: false,
  bio: '<b>Juguetona</b>',
  traits: ['tranquila'],
  photos: [{ url: 'https://cdn.example/canela.webp', width: 800, height: 600 }],
  published_at: null,
  updated_at: null,
  ...overrides
});

function mount(attrs: Record<string, string>, pets: AdoptionPet[] | Error = [pet()]) {
  const fetch = vi.fn(async (url: string) => {
    if (pets instanceof Error) return new Response(JSON.stringify({ error: pets.message }), { status: 403 });
    const lang = new URL(url).searchParams.get('lang');
    return new Response(JSON.stringify({ location: { name: 'Baja' }, lang, pets }), { status: 200 });
  });
  const element = document.createElement('clourora-adoptions');
  element.client = createClient({ apiKey: attrs['api-key'] ?? 'k', baseUrl: 'https://api.test', fetch });
  for (const [k, v] of Object.entries(attrs)) element.setAttribute(k, v);
  document.body.append(element);
  return { element, fetch };
}

const loaded = (element: ClouroraAdoptionsElement) =>
  new Promise<CustomEvent>(resolve =>
    element.addEventListener('clourora-load', e => resolve(e as CustomEvent), { once: true })
  );
const shadow = (element: ClouroraAdoptionsElement) => element.shadowRoot!;

afterEach(() => {
  document.body.replaceChildren();
});

describe('<clourora-adoptions>', () => {
  it('is defined once', () => {
    expect(customElements.get('clourora-adoptions')).toBeDefined();
  });

  it('renders cards with the labels of its language, text-only (no HTML injection)', async () => {
    const { element, fetch } = mount({ lang: 'en', status: 'available' });
    await loaded(element);
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0]![0]).toContain('lang=en&status=available');
    const card = shadow(element).querySelector('[part=card]')!;
    expect(card.querySelector('[part=name]')!.textContent).toBe('Canela');
    expect(card.querySelector('[part=meta]')!.textContent).toBe('Female · 2 years · Medium · Mestizo');
    expect([...card.querySelectorAll('li')].map(li => li.textContent)).toEqual([
      'tranquila',
      'Spayed/neutered',
      'Good with kids'
    ]);
    expect(card.querySelector('[part=bio]')!.innerHTML).toBe('&lt;b&gt;Juguetona&lt;/b&gt;');
    expect(card.querySelector('img')!.getAttribute('src')).toBe('https://cdn.example/canela.webp');
  });

  it('marks reserved pets and fills the CTA link', async () => {
    const { element } = mount({ 'cta-href': 'https://wa.me/1?text=Hola {name} #{id}' }, [
      pet({ status: 'reserved', name: 'Coco Loco' })
    ]);
    await loaded(element);
    expect(shadow(element).querySelector('[part=badge]')!.textContent).toBe('Reservado');
    expect(shadow(element).querySelector<HTMLAnchorElement>('[part=cta]')!.href).toBe(
      'https://wa.me/1?text=Hola%20Coco%20Loco%20#7'
    );
  });

  it('shows the empty state', async () => {
    const { element } = mount({ lang: 'fr' }, []);
    await loaded(element);
    expect(shadow(element).querySelector('[part=state]')!.textContent).toContain('Aucun animal');
  });

  it('reports errors with an event and the error state', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { element } = mount({}, new Error('origin_not_allowed'));
    const error = await new Promise<CustomEvent>(resolve =>
      element.addEventListener('clourora-error', e => resolve(e as CustomEvent))
    );
    expect(error.detail.code).toBe('origin_not_allowed');
    expect(shadow(element).querySelector('[part=state]')!.textContent).toBe('No se pudieron cargar las mascotas.');
    warn.mockRestore();
  });

  it('emits clourora-pet-select on click and re-fetches when lang changes, once per batch of attribute changes', async () => {
    const { element, fetch } = mount({ lang: 'es' });
    await loaded(element);
    const select = vi.fn();
    element.addEventListener('clourora-pet-select', select);
    shadow(element).querySelector<HTMLElement>('[part=card]')!.click();
    expect(select.mock.calls[0]![0].detail.pet.id).toBe(7);

    const next = loaded(element);
    element.setAttribute('lang', 'en');
    element.setAttribute('species', 'dog');
    await next;
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1]![0]).toContain('lang=en&species=dog');
  });
});
