import {
  createClient,
  formatPetAge,
  isClouroraError,
  LANGS,
  type AdoptionList,
  type AdoptionPet,
  type AdoptionStatus,
  type ClouroraClient,
  type Lang
} from '@clourora/sdk';
import { LABELS, type Labels } from './labels';
import { STYLES } from './styles';

// Importing this module on a server (SSR, Node) must not crash: there's no HTMLElement there.
const Base = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement;

export interface PetSelectDetail {
  pet: AdoptionPet;
}

/**
 * <clourora-adoptions api-key="ck_pub_…" lang="es"></clourora-adoptions>
 *
 * Attributes: api-key (required), lang (es|en|fr, default the page's <html lang>), status ("available,reserved"),
 * species ("perro", "dog", or an id), base-url, cta-href (link on each card; {id} and {name} are replaced, e.g.
 * "https://wa.me/5215555555555?text=Me interesa {name}"), cta-label.
 * Property `client`: reuse an @clourora/sdk client instead of api-key/base-url.
 *
 * Events (bubble, composed): clourora-load {detail: AdoptionList}, clourora-error {detail: ClouroraError},
 * clourora-pet-select {detail: {pet}} when a card is clicked (call preventDefault() to stop the cta-href navigation).
 *
 * Styling: CSS custom properties --clourora-accent, --clourora-on-accent, --clourora-surface, --clourora-text,
 * --clourora-muted, --clourora-radius, --clourora-gap, --clourora-card-min, --clourora-shadow; parts grid, card, photo,
 * badge, body, name, meta, tags, bio, cta, state.
 */
export class ClouroraAdoptionsElement extends Base {
  static readonly observedAttributes = ['api-key', 'lang', 'status', 'species', 'base-url', 'cta-href', 'cta-label'];

  #client: ClouroraClient | null = null;
  #ownClient: ClouroraClient | null = null;
  #ownClientKey = '';
  #abort: AbortController | null = null;
  #list: AdoptionList | null = null;
  #root: ShadowRoot;
  #scheduled = false;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = STYLES;
    const state = el('p', 'state');
    const grid = el('div', 'grid');
    grid.setAttribute('role', 'list');
    this.#root.append(style, state, grid);
  }

  /** An existing client (Angular apps, custom fetch). Overrides api-key/base-url. */
  get client(): ClouroraClient | null {
    return this.#client;
  }
  set client(value: ClouroraClient | null) {
    this.#client = value;
    this.#schedule();
  }

  /** The last list shown */
  get list(): AdoptionList | null {
    return this.#list;
  }

  connectedCallback(): void {
    this.#schedule();
  }

  disconnectedCallback(): void {
    this.#abort?.abort();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;
    if (name === 'cta-href' || name === 'cta-label') {
      if (this.#list) this.#render(this.#list);
      return;
    }
    this.#schedule();
  }

  /** Fetches again (e.g. after the business published a pet). */
  refresh(): Promise<void> {
    return this.#load();
  }

  get #lang(): Lang {
    const raw = (this.getAttribute('lang') || document.documentElement.lang || 'es').slice(0, 2).toLowerCase();
    return (LANGS as readonly string[]).includes(raw) ? (raw as Lang) : 'es';
  }

  get #labels(): Labels {
    return LABELS[this.#lang];
  }

  // Several attributes set in a row cause one request
  #schedule(): void {
    if (this.#scheduled || !this.isConnected) return;
    this.#scheduled = true;
    queueMicrotask(() => {
      this.#scheduled = false;
      if (this.isConnected) void this.#load();
    });
  }

  #resolveClient(): ClouroraClient | null {
    if (this.#client) return this.#client;
    const apiKey = this.getAttribute('api-key');
    if (!apiKey) return null;
    const baseUrl = this.getAttribute('base-url') || undefined;
    const key = `${apiKey}|${baseUrl ?? ''}`;
    if (!this.#ownClient || this.#ownClientKey !== key) {
      this.#ownClient = createClient({ apiKey, baseUrl });
      this.#ownClientKey = key;
    }
    return this.#ownClient;
  }

  async #load(): Promise<void> {
    const client = this.#resolveClient();
    if (!client) {
      this.#showState(this.#labels.error);
      console.warn('<clourora-adoptions>: set the api-key attribute');
      return;
    }
    this.#abort?.abort();
    const abort = (this.#abort = new AbortController());
    if (!this.#list) this.#showState(this.#labels.loading);
    this.setAttribute('aria-busy', 'true');

    const status = this.getAttribute('status')
      ?.split(',')
      .map(s => s.trim())
      .filter(Boolean) as AdoptionStatus[] | undefined;
    try {
      const list = await client.adoptions.list({
        lang: this.#lang,
        status: status?.length ? status : undefined,
        species: this.getAttribute('species') || undefined,
        signal: abort.signal
      });
      if (abort.signal.aborted) return;
      this.#list = list;
      this.#render(list);
      this.#emit('clourora-load', list);
    } catch (error) {
      if (abort.signal.aborted) return;
      this.#showState(this.#labels.error);
      if (isClouroraError(error)) console.warn(`<clourora-adoptions>: ${error.code}: ${error.message}`);
      this.#emit('clourora-error', error);
    } finally {
      if (this.#abort === abort) this.removeAttribute('aria-busy');
    }
  }

  #showState(text: string): void {
    const state = this.#root.querySelector<HTMLElement>('.state')!;
    state.textContent = text;
    state.hidden = false;
    this.#root.querySelector('.grid')!.replaceChildren();
  }

  #render(list: AdoptionList): void {
    const state = this.#root.querySelector<HTMLElement>('.state')!;
    const grid = this.#root.querySelector('.grid')!;
    if (!list.pets.length) {
      this.#showState(this.#labels.empty);
      return;
    }
    state.hidden = true;
    grid.replaceChildren(...list.pets.map(pet => this.#card(pet, list.lang)));
  }

  #card(pet: AdoptionPet, lang: Lang): HTMLElement {
    const t = LABELS[lang] ?? this.#labels;
    const card = el('article', 'card');
    card.setAttribute('role', 'listitem');
    card.tabIndex = 0;
    card.dataset['petId'] = String(pet.id);

    const photo = el('div', 'photo');
    const cover = pet.photos[0];
    if (cover) {
      const img = document.createElement('img');
      img.src = cover.url;
      img.alt = pet.name;
      img.loading = 'lazy';
      img.decoding = 'async';
      if (cover.width && cover.height) {
        img.width = cover.width;
        img.height = cover.height;
      }
      photo.append(img);
    }
    if (pet.status === 'reserved') photo.append(el('span', 'badge', t.reserved));

    const body = el('div', 'body');
    body.append(el('h3', 'name', pet.name));
    const meta = [
      pet.sex ? t[pet.sex] : '',
      formatPetAge(pet.age_months, lang),
      pet.size ? t[pet.size] : '',
      pet.breed ?? ''
    ]
      .filter(Boolean)
      .join(' · ');
    if (meta) body.append(el('p', 'meta', meta));

    const tags = [
      ...pet.traits,
      ...(pet.vaccinated ? [t.vaccinated] : []),
      ...(pet.sterilized ? [t.sterilized] : []),
      ...(pet.good_with_kids ? [t.kids] : []),
      ...(pet.good_with_dogs ? [t.dogs] : []),
      ...(pet.good_with_cats ? [t.cats] : [])
    ];
    if (tags.length) {
      const ul = el('ul', 'tags');
      ul.append(...tags.map(tag => el('li', '', tag)));
      body.append(ul);
    }
    if (pet.bio) body.append(el('p', 'bio', pet.bio));

    const href = this.getAttribute('cta-href');
    if (href) {
      const cta = el('a', 'cta', this.getAttribute('cta-label') || t.cta) as HTMLAnchorElement;
      cta.href = href.replaceAll('{id}', String(pet.id)).replaceAll('{name}', encodeURIComponent(pet.name));
      cta.target = '_blank';
      cta.rel = 'noopener';
      body.append(cta);
    }
    card.append(photo, body);

    const select = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') return;
      // Enter on the CTA also fires a click, handled there
      if (event instanceof KeyboardEvent && event.target instanceof HTMLAnchorElement) return;
      if (event.target instanceof HTMLAnchorElement) {
        // The CTA itself: let the page cancel the navigation
        if (!this.#emit('clourora-pet-select', { pet } satisfies PetSelectDetail, true)) event.preventDefault();
        return;
      }
      if (event instanceof KeyboardEvent) event.preventDefault();
      this.#emit('clourora-pet-select', { pet } satisfies PetSelectDetail, true);
    };
    card.addEventListener('click', select);
    card.addEventListener('keydown', select);
    return card;
  }

  /** false when a listener called preventDefault() */
  #emit(type: string, detail: unknown, cancelable = false): boolean {
    return this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true, cancelable }));
  }
}

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
    node.setAttribute('part', className);
  }
  if (text !== undefined) node.textContent = text;
  return node;
}

declare global {
  interface HTMLElementTagNameMap {
    'clourora-adoptions': ClouroraAdoptionsElement;
  }
}
