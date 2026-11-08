<p align="center">
  <a href="https://clourora.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Manbec/Clourora-JS/main/.github/assets/clourora-logo-dark.png" />
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Manbec/Clourora-JS/main/.github/assets/clourora-logo-light.png" />
      <img alt="Clourora" src="https://raw.githubusercontent.com/Manbec/Clourora-JS/main/.github/assets/clourora-logo-light.png" width="360" />
    </picture>
  </a>
</p>

# @clourora/angular

Angular bindings for [`@clourora/sdk`](https://www.npmjs.com/package/@clourora/sdk): signal resources for
Clourora's public API. Angular 20–22, standalone, zoneless-friendly, SSR-ready.

```bash
npm i @clourora/sdk @clourora/angular
```

```ts
// app.config.ts
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClourora } from '@clourora/angular';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient(withFetch()), provideClourora({ apiKey: environment.clourora.apiKey })]
};
```

```ts
// adoptions.component.ts
import { adoptionsResource } from '@clourora/angular';
import { formatPetAge, type Lang } from '@clourora/sdk';

export class AdoptionsComponent {
  readonly lang = signal<Lang>('es');
  /** Re-fetches (cancelling the previous request) when lang changes */
  readonly adoptions = adoptionsResource(() => ({ lang: this.lang(), status: 'available' }));
  readonly age = formatPetAge;
}
```

```html
@if (adoptions.isLoading()) {
<p>Cargando…</p>
} @if (adoptions.error(); as error) {
<p>{{ error.message }}</p>
} @for (pet of adoptions.value()?.pets; track pet.id) {
<h3>{{ pet.name }}</h3>
<p>{{ age(pet.age_months, lang()) }}</p>
}
```

|                                                               |                                                                                           |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `adoptionsResource(params?)`                                  | the list; `params` is an object or a function reading signals; return `undefined` to wait |
| `adoptionPetResource(() => ({ id, lang }))`                   | one pet, `value()` is `null` when it isn't published                                      |
| `localizedAdoptionsResource(() => ({ langs: ['es', 'en'] }))` | the list with texts in several languages                                                  |
| `injectClourora()`                                            | the client, for calls outside resources                                                   |

Requests go through `HttpClient` by default, so the app's interceptors run and, with `provideClientHydration()`, the
server-rendered responses are reused on hydration instead of being fetched again. `provideClourora({ …, useHttpClient: false })`
uses the global `fetch` instead.

The package has no decorators (only `InjectionToken`, `inject()` and `resource()`), so one build serves every supported
Angular version.
