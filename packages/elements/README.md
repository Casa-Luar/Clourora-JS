<p align="center">
  <a href="https://clourora.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/Casa-Luar/Clourora-JS/main/.github/assets/clourora-logo-dark.png" />
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Casa-Luar/Clourora-JS/main/.github/assets/clourora-logo-light.png" />
      <img alt="Clourora" src="https://raw.githubusercontent.com/Casa-Luar/Clourora-JS/main/.github/assets/clourora-logo-light.png" width="360" />
    </picture>
  </a>
</p>

# @clourora/elements

[Clourora](https://clourora.com)'s UI kit as web components. They work on any website: plain HTML, WordPress, Wix,
Squarespace, and inside Angular, React or Vue.

## `<clourora-adoptions>`

The pets a business publishes for adoption in Clourora, as a responsive card grid.

```html
<script src="https://cdn.jsdelivr.net/npm/@clourora/elements@0.1/dist/clourora-elements.js" defer></script>

<clourora-adoptions
  api-key="ck_pub_…"
  lang="es"
  cta-href="https://wa.me/5215555555555?text=Hola, me interesa {name}"
  style="--clourora-accent: #2e7d32"
></clourora-adoptions>
```

With a bundler: `npm i @clourora/elements` and `import '@clourora/elements';` (registers the element).

**CDN.** The `<script>` above is served by jsDelivr straight from npm, so there's nothing to host. Use `@0.1` (from
1.0 on, `@1`) to get fixes automatically without breaking changes, or an exact version such as `@0.1.1` plus an
`integrity` hash. Other URLs: `https://unpkg.com/@clourora/elements@0.1/dist/clourora-elements.js`, or as an ES module
`https://cdn.jsdelivr.net/npm/@clourora/elements@0.1/+esm`. More in the
[repository README](https://github.com/Casa-Luar/Clourora-JS#use-it-from-a-cdn).

| Attribute   |                                                                                    |
| ----------- | ---------------------------------------------------------------------------------- |
| `api-key`   | publishable key (`ck_pub_…`) from Clourora: My Business → Negocio → Pet adoption   |
| `lang`      | `es`, `en` or `fr`; default the page's `<html lang>`, else `es`                    |
| `status`    | `available`, `reserved` or both (comma separated); default both                    |
| `species`   | `perro`, `dog`, `gato`… or the species id                                          |
| `cta-href`  | a link on each card; `{name}` and `{id}` are replaced                              |
| `cta-label` | text of that link (default "Me interesa" / "I'm interested" / "Je suis intéressé") |
| `base-url`  | another API host (local development)                                               |

Property `client`: pass an existing `@clourora/sdk` client instead of `api-key`. Method `refresh()` fetches again.

**Events** (bubble out of the shadow DOM): `clourora-load` (`detail`: the list), `clourora-error` (`detail`: a
`ClouroraError` with `code`), `clourora-pet-select` (`detail.pet`, on card click or Enter; `preventDefault()` on it
stops the `cta-href` link).

**Styling.** CSS custom properties `--clourora-accent`, `--clourora-on-accent`, `--clourora-surface`,
`--clourora-text`, `--clourora-muted`, `--clourora-radius`, `--clourora-gap`, `--clourora-card-min`,
`--clourora-shadow`; and parts for anything else:

```css
clourora-adoptions::part(name) {
  font-family: 'Fraunces', serif;
}
clourora-adoptions::part(card) {
  border: 1px solid #eee;
  box-shadow: none;
}
```

Parts: `grid`, `card`, `photo`, `badge`, `body`, `name`, `meta`, `tags`, `bio`, `cta`, `state`.

In Angular, add `CUSTOM_ELEMENTS_SCHEMA` to the component that uses the tag, or use `@clourora/angular` and your own markup.
