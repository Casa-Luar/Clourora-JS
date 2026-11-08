import type { AdoptionPet } from '../src/types';

export function pet(overrides: Partial<AdoptionPet> = {}): AdoptionPet {
  return {
    id: 7,
    name: 'Canela',
    status: 'available',
    species: 'Perro',
    breed: 'Mestizo',
    sex: 'female',
    age_months: 26,
    birth_month: '2024-09',
    size: 'medium',
    color: 'Café',
    sterilized: true,
    vaccinated: true,
    good_with_kids: true,
    good_with_dogs: null,
    good_with_cats: false,
    bio: 'Juguetona',
    traits: ['tranquila'],
    photos: [{ url: 'https://cdn.example/canela.webp', width: 800, height: 600 }],
    published_at: '2026-11-05 10:00:00',
    updated_at: '2026-11-05 10:00:00',
    ...overrides
  };
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
