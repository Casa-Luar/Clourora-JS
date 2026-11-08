import { resource, type ResourceRef } from '@angular/core';
import type {
  AdoptionGetParams,
  AdoptionList,
  AdoptionListParams,
  AdoptionPet,
  Lang,
  LocalizedAdoptionPet
} from '@clourora/sdk';
import { injectClourora } from './provide';

type Reactive<T> = T | (() => T);

function read<T>(value: Reactive<T>): T {
  return typeof value === 'function' ? (value as () => T)() : value;
}

/**
 * The published pets as a signal resource. Pass a function to make it reactive: it re-fetches (and cancels the previous
 * request) whenever a signal it reads changes. Return undefined to wait.
 *
 *   readonly lang = signal<Lang>('es');
 *   readonly pets = adoptionsResource(() => ({ lang: this.lang() }));
 *   // template: @for (pet of pets.value()?.pets; track pet.id) { ... }
 */
export function adoptionsResource(
  params: Reactive<Omit<AdoptionListParams, 'signal'> | undefined> = {}
): ResourceRef<AdoptionList | undefined> {
  const client = injectClourora();
  return resource({
    params: () => read(params),
    loader: ({ params, abortSignal }) => client.adoptions.list({ ...params, signal: abortSignal })
  });
}

/** One pet; value() is null when it isn't published. */
export function adoptionPetResource(
  params: Reactive<({ id: number } & Omit<AdoptionGetParams, 'signal'>) | undefined>
): ResourceRef<AdoptionPet | null | undefined> {
  const client = injectClourora();
  return resource({
    params: () => read(params),
    loader: ({ params, abortSignal }) => client.adoptions.get(params.id, { lang: params.lang, signal: abortSignal })
  });
}

/** The list with texts in several languages, for sites whose language switch shouldn't wait for a request. */
export function localizedAdoptionsResource(
  params: Reactive<({ langs: readonly Lang[] } & Omit<AdoptionListParams, 'lang' | 'signal'>) | undefined>
): ResourceRef<{ location: AdoptionList['location']; pets: LocalizedAdoptionPet[] } | undefined> {
  const client = injectClourora();
  return resource({
    params: () => read(params),
    loader: ({ params: { langs, ...rest }, abortSignal }) =>
      client.adoptions.listInLanguages(langs, { ...rest, signal: abortSignal })
  });
}
