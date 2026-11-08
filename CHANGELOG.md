# Changelog

All three packages (`@clourora/sdk`, `@clourora/angular`, `@clourora/elements`) share one version. How to release:
[RELEASING.md](RELEASING.md).

## 0.1.1 (2026-11-08)

First release.

- sdk: `createClient` with `adoptions.list`, `adoptions.get`, `adoptions.listInLanguages`; `ClouroraError` with stable
  codes; `formatPetAge`; `@clourora/sdk/server` with `createServerClient` (120 s cache). Calls the public API v1.
- angular: `provideClourora`, `injectClourora`, `adoptionsResource`, `adoptionPetResource`,
  `localizedAdoptionsResource`, requests through `HttpClient`.
- elements: `<clourora-adoptions>` web component (es/en/fr, CSS variables and parts, CTA link, events) and a
  single-file CDN build.

`0.1.0` was tagged but never published.
