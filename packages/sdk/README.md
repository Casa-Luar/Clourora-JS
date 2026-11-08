<p align="center">
  <a href="https://clourora.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Casa-Luar/Clourora-JS/main/.github/assets/clourora-logo-dark.png" />
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Casa-Luar/Clourora-JS/main/.github/assets/clourora-logo-light.png" />
      <img alt="Clourora" src="https://raw.githubusercontent.com/Casa-Luar/Clourora-JS/main/.github/assets/clourora-logo-light.png" width="360" />
    </picture>
  </a>
</p>

# @clourora/sdk

Typed client for [Clourora](https://clourora.com)'s public API. No dependencies, ESM + CJS, runs in browsers,
Node 20+, Deno, Bun and edge runtimes.

```bash
npm i @clourora/sdk
```

```ts
import { createClient, formatPetAge, isClouroraError } from '@clourora/sdk';

const clourora = createClient({ apiKey: 'ck_pub_…', lang: 'es' });

const { location, pets } = await clourora.adoptions.list({ status: 'available', species: 'perro' });
const pet = await clourora.adoptions.get(42, { lang: 'en' }); // null when not published

// A site with a language switcher: every language at once, texts per language in pet.texts
const { pets: localized } = await clourora.adoptions.listInLanguages(['es', 'en']);
localized[0].texts.en?.bio;

formatPetAge(pets[0].age_months, 'es'); // "2 años"
```

Errors are `ClouroraError` with a stable `code`: `invalid_key`, `origin_not_allowed`, `scope_not_allowed`,
`module_off`, `not_found`, `rate_limited`, `network_error`, `invalid_response`, `http_error`.

```ts
try {
  await clourora.adoptions.list();
} catch (error) {
  if (isClouroraError(error) && error.code === 'origin_not_allowed') {
    // add this site's origin to the key in Clourora
  }
}
```

### Without a bundler (CDN)

```html
<script type="module">
  import { createClient } from 'https://cdn.jsdelivr.net/npm/@clourora/sdk@0.1/+esm';
  const { pets } = await createClient({ apiKey: 'ck_pub_…' }).adoptions.list();
</script>
```

Version pinning and the other CDN URLs are in the [repository README](https://github.com/Casa-Luar/Clourora-JS#use-it-from-a-cdn).

### Servers

```ts
import { createServerClient } from '@clourora/sdk/server';

// Same calls, plus an in-memory cache (120 s, like the API's Cache-Control) so a busy server, SSR or a static-site
// build doesn't ask Clourora once per visitor. Throws if bundled into a browser.
const clourora = createServerClient({ apiKey: process.env.CLOURORA_API_KEY! });
```

### Options

| Option         | Default                          |                                                                  |
| -------------- | -------------------------------- | ---------------------------------------------------------------- |
| `apiKey`       | required                         | publishable key, `ck_pub_…`                                      |
| `baseUrl`      | `https://api.clourora.com`       |                                                                  |
| `lang`         | `'es'`                           | default language of calls that don't pass one (`es`, `en`, `fr`) |
| `fetch`        | `globalThis.fetch`               | custom fetch (tests, proxies)                                    |
| `cacheSeconds` | `0` (`120` on the server client) | in-memory cache of successful GETs                               |
| `headers`      |                                  | extra headers on every request                                   |
