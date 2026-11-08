# Releasing a new version

`@clourora/sdk`, `@clourora/angular` and `@clourora/elements` are released **together, always with the same version**,
even when only one of them changed. One tag (`vX.Y.Z`) releases all three. This keeps the `@clourora/sdk` range in the
other two exact and gives one version to talk about in docs, CDN links and support.

Publishing is **staged**: CI uploads the versions, and nothing is public until a maintainer approves each one with
2FA on npmjs.com.

```
bump versions ─► commit ─► push tag vX.Y.Z ─► GitHub Actions "Release" ─► staged on npm ─► you approve (2FA) ─► live
                                              (test, build, stage)                        sdk → angular → elements
```

## Which version number

Semantic versioning, from the point of view of someone using the packages:

| Change                                                                                                        | Bump  | Example                                                               |
| ------------------------------------------------------------------------------------------------------------- | ----- | --------------------------------------------------------------------- |
| Bug fix, docs, internal refactor, no API change                                                               | patch | `0.1.1 → 0.1.2`                                                       |
| New method, option, field type, element attribute, endpoint (backwards compatible)                            | minor | `0.1.2 → 0.2.0`                                                       |
| Anything that breaks existing code: renamed or removed export, changed type or default, a new required option | major | `1.4.0 → 2.0.0`                                                       |
| The backend's public API goes to a new version (`/publicapi/v2`)                                              | major | the SDK major follows the API version: `1.x` calls v1, `2.x` calls v2 |

While the version is **0.x** the packages are a preview. A breaking change bumps the minor (`0.2.0 → 0.3.0`), because
the CDN links and `^0.2.0` ranges never cross a minor in 0.x. The first stable release is `1.0.0`.

## Steps

### 1. Start from a green `main`

```bash
cd /path/to/clourora-js
git checkout main && git pull
git status            # must be clean
```

On GitHub, the latest **CI** run on `main` must be green (Actions tab).

### 2. Write the changelog entry

Add a section at the top of `CHANGELOG.md`:

```md
## 0.2.0 (2026-12-01)

- sdk: `adoptions.list` accepts `size`.
- elements: `<clourora-adoptions>` gets a `columns` attribute.
```

### 3. Bump the versions

```bash
npm run version:set -- 0.2.0     # every package + the @clourora/sdk ranges in angular and elements
npm install                      # refreshes package-lock.json (CI runs `npm ci`, which fails if it's stale)
```

Don't edit the versions by hand, and don't use `npm version`. It doesn't update the `@clourora/sdk` ranges, and the
release job checks that all three versions equal the tag.

### 4. Check locally

```bash
npm run release:check            # build + tests + the file list each package would publish
npm ci                           # same install as CI; must succeed
```

Look at the `npm pack` output: only `dist/`, `README.md`, `LICENSE` and `package.json` should be in each package.

### 5. Commit, tag, push

```bash
git add -A
git commit -m "Release v0.2.0"
git tag v0.2.0
git push origin main
git push origin v0.2.0           # this starts the Release workflow
```

The tag must be exactly `v` + the version in the three `package.json` files, or the workflow stops before staging.

### 6. Watch the Release run

GitHub → **Actions** → **Release** → the run for `v0.2.0`. It runs:

1. `npm ci`
2. tag ↔ package versions check
3. typecheck, tests, build
4. `npm stage publish` in `packages/sdk`, `packages/angular` and `packages/elements`, with provenance

If it fails **before** the stage step, nothing was uploaded. Fix the problem on `main` and release the **next patch**
(`v0.2.1`). Don't move or reuse a tag: tags are treated as immutable.

### 7. Approve on npm (2FA)

Approve in this order: **sdk first**, because angular and elements depend on it.

- **Website:** sign in at [npmjs.com](https://www.npmjs.com). Each package shows its staged version: review it and
  approve it with your 2FA code.
- **Terminal:**

  ```bash
  npm login                      # once per machine
  npm stage list                 # staged versions with their ids
  npm stage view <stage-id>      # optional: details
  npm stage download <stage-id>  # optional: the exact tarball, to inspect
  npm stage approve <stage-id>   # asks for the 2FA code; repeat for each package
  ```

A staged version that shouldn't go out: `npm stage reject <stage-id>`.

### 8. Check it's live

```bash
npm view @clourora/sdk version
npm view @clourora/angular version
npm view @clourora/elements version
```

The CDN picks up the version by itself:

- Exact: `https://cdn.jsdelivr.net/npm/@clourora/elements@0.2.0/dist/clourora-elements.js` works within minutes.
- Ranges (`@0.2`, `@1`) can take up to about 12 hours. To refresh one at once, open
  `https://purge.jsdelivr.net/npm/@clourora/elements@0.2/dist/clourora-elements.js`.

Optionally, create a GitHub release from the tag (Releases → Draft a new release → tag `v0.2.0`) and paste the
changelog section.

## Prereleases (beta)

To let a site try a version before everyone gets it:

```bash
npm run version:set -- 0.3.0-beta.1
npm install
git commit -am "Release v0.3.0-beta.1"
git tag v0.3.0-beta.1
git push origin main v0.3.0-beta.1
```

A tag with a `-` is staged under the **`next`** dist-tag, so `npm i @clourora/sdk` still installs the stable version.
Testers use `npm i @clourora/sdk@next` or the exact version. The next beta is `-beta.2`, and the final release is
`0.3.0`.

## When something went wrong after publishing

| Situation                                          | What to do                                                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| A published version has a bug                      | Fix it and release a patch. Warn on the bad one: `npm deprecate @clourora/sdk@0.2.0 "Use 0.2.1: <reason>"` (once per package). |
| A published version broke compatibility by mistake | Release a patch that restores the old behaviour, and deprecate the bad version. Put the change in the next major.              |
| Wrong `latest` dist-tag                            | `npm dist-tag add @clourora/sdk@0.1.1 latest`                                                                                  |
| Unpublishing                                       | Avoid it. npm only allows it within 72 hours, and sites using the CDN break. Deprecate instead.                                |

## Authentication

The workflow stages with the `NPM_TOKEN` repository secret: a granular npm token with **Read and write (stage only)**
on the `@clourora` scope. A stage-only token can't publish anything directly, because every version still needs 2FA
approval.

Better, with no token: on npmjs.com, open each package → **Settings → Trusted Publisher → GitHub Actions**. Enter
`Casa-Luar` / `Clourora-JS` / `release.yml`, restricted to stage only, then delete the `NPM_TOKEN` secret. The workflow
already has `id-token: write`.

## Adding a new package

1. Create `packages/<name>` with `package.json` (`"name": "@clourora/<name>"`, same version, `publishConfig`,
   `repository` with `"directory": "packages/<name>"`), `tsup.config.ts`, `tsconfig.json`, `vitest.config.ts`,
   `README.md`, `LICENSE`.
2. Add it to `workspaces` in the root `package.json`, to the loop in `scripts/set-version.mjs`, and to the two loops
   in `.github/workflows/release.yml` (version check and stage), after the packages it depends on.
3. Its first release goes through the same staged flow. Once it exists on npm, set up its trusted publisher.
