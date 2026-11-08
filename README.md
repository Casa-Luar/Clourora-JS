<p align="center">
  <a href="https://clourora.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset=".github/assets/clourora-logo-dark.png" />
      <source media="(prefers-color-scheme: light)" srcset=".github/assets/clourora-logo-light.png" />
      <img alt="Clourora" src=".github/assets/clourora-logo-light.png" width="360" />
    </picture>
  </a>
</p>

# Clourora-JS

JavaScript and TypeScript packages for [Clourora](https://clourora.com)'s public API: what a business publishes in
Clourora (pets up for adoption, more to come), shown on its own website.

| Package                                   | For                                                                                                                                  | Install                                 |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| [`@clourora/sdk`](packages/sdk)           | Any JS runtime: browsers, Node 20+, Deno, Bun, edge. Typed client, no dependencies. `@clourora/sdk/server` adds a cache for servers. | `npm i @clourora/sdk`                   |
| [`@clourora/angular`](packages/angular)   | Angular 20–22: `provideClourora()` + signal resources, through HttpClient (interceptors, SSR transfer cache).                        | `npm i @clourora/sdk @clourora/angular` |
| [`@clourora/elements`](packages/elements) | UI kit as web components (`<clourora-adoptions>`). Works on any site, one `<script>` from a CDN.                                     | `npm i @clourora/elements`              |

All of them need a **publishable API key** (`ck_pub_…`), created in Clourora: _My Business → Negocio → Pet adoption_.
It can only read what the business published, and each key lists the website origins it answers.

```html
<!-- No build step: any website -->
<script src="https://cdn.jsdelivr.net/npm/@clourora/elements@0.1/dist/clourora-elements.js" defer></script>
<clourora-adoptions api-key="ck_pub_…" lang="es"></clourora-adoptions>
```

```ts
// Any JS/TS code
import { createClient } from '@clourora/sdk';
const clourora = createClient({ apiKey: 'ck_pub_…' });
const { pets } = await clourora.adoptions.list({ lang: 'en' });
```

## Use it from a CDN

You don't host anything. Every file in the published npm packages is served automatically by public CDNs that mirror
npm ([jsDelivr](https://www.jsdelivr.com) and [unpkg](https://unpkg.com)). They're live as soon as a version is published.

### The UI kit: one `<script>` tag

`@clourora/elements` ships `dist/clourora-elements.js`, a single file with the SDK inside and no imports. It registers
`<clourora-adoptions>` as soon as it loads. This works on plain HTML, WordPress, Wix and Squarespace.

```html
<script src="https://cdn.jsdelivr.net/npm/@clourora/elements@0.1/dist/clourora-elements.js" defer></script>

<clourora-adoptions api-key="ck_pub_…" lang="es"></clourora-adoptions>
```

| CDN                       | URL                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| jsDelivr (recommended)    | `https://cdn.jsdelivr.net/npm/@clourora/elements@0.1/dist/clourora-elements.js`                  |
| jsDelivr, short form      | `https://cdn.jsdelivr.net/npm/@clourora/elements@0.1`                                            |
| unpkg                     | `https://unpkg.com/@clourora/elements@0.1/dist/clourora-elements.js`                             |
| jsDelivr, as an ES module | `<script type="module" src="https://cdn.jsdelivr.net/npm/@clourora/elements@0.1/+esm"></script>` |

### The SDK in the browser, without a bundler

```html
<script type="module">
  import { createClient } from 'https://cdn.jsdelivr.net/npm/@clourora/sdk@0.1/+esm';

  const clourora = createClient({ apiKey: 'ck_pub_…' });
  const { pets } = await clourora.adoptions.list({ lang: 'es' });
  console.log(pets);
</script>
```

### Which version to put in the URL

| In the URL              | What the site gets                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `@0.1.1` (exact)        | That build forever. Cached for a long time. Updating means editing the URL.                                             |
| `@0.1` (from 1.0: `@1`) | New releases in that range within about 12 hours: fixes arrive by themselves, never a breaking change. **Recommended.** |
| no version              | Always the latest, including a future major with breaking changes. Don't use it on a live site.                         |

Pinning an exact version also lets you add [Subresource Integrity](https://developer.mozilla.org/docs/Web/Security/Subresource_Integrity).
jsDelivr shows the `integrity` hash for each file on the package page
([jsdelivr.com/package/npm/@clourora/elements](https://www.jsdelivr.com/package/npm/@clourora/elements)):

```html
<script
  src="https://cdn.jsdelivr.net/npm/@clourora/elements@0.1.1/dist/clourora-elements.js"
  integrity="sha384-…"
  crossorigin="anonymous"
  defer
></script>
```

Browse what a published version contains: `https://cdn.jsdelivr.net/npm/@clourora/elements@0.1.1/` (a file listing).

## API versions

The packages call `https://api.clourora.com/publicapi/v1/…`. Within v1 the API only adds fields. A breaking change
would be `/v2`, and that's what a new major version of `@clourora/sdk` would call, so `npm update` within a major
never breaks a site. Until 1.0.0 these packages are a preview: minor versions may still change their TypeScript API.

## Development

```bash
npm install
npm test          # Vitest in every package
npm run build     # tsup: ESM (+ CJS for the SDK, + IIFE for the CDN build of elements) and .d.ts
npm run typecheck
npm run release:check   # build + test + what each package would publish
```

`examples/cdn.html` shows the web component against a local API (`base-url`).

### Releasing

Versions move together. Bump `version` in the three `packages/*/package.json` (and the `@clourora/sdk` range in the
other two), commit, tag `vX.Y.Z` and push the tag. `.github/workflows/release.yml` checks that the tag matches, tests,
builds and **stages** the three packages with provenance (`npm stage publish`). Nothing is public until a maintainer
approves each staged version with 2FA, on npmjs.com or with `npm stage list` and `npm stage approve <id>`.

Authentication: the `NPM_TOKEN` repository secret holds a granular token with **Read and write (stage only)** on the
`@clourora` scope. Once the packages exist, configure trusted publishing on each one (npmjs.com → package → Settings →
Trusted Publisher → GitHub Actions, `Casa-Luar/Clourora-JS`, `release.yml`, stage only) and delete the secret.
