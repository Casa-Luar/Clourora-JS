import { ClouroraAdoptionsElement } from './adoptions-element';

export { ClouroraAdoptionsElement } from './adoptions-element';
export type { PetSelectDetail } from './adoptions-element';
export { LABELS } from './labels';
export type { Labels } from './labels';

/** Registers the elements (done on import; safe to call again, a no-op on servers). */
export function defineClouroraElements(): void {
  if (typeof customElements === 'undefined') return;
  if (!customElements.get('clourora-adoptions')) customElements.define('clourora-adoptions', ClouroraAdoptionsElement);
}

defineClouroraElements();
