# josiahwsmith10.github.io

Source for my personal website + blog — [josiahwsmith10.github.io](https://josiahwsmith10.github.io).
Built with [Astro](https://astro.build) (static output, React islands where an
interaction earns it) and published to GitHub Pages automatically on every push to `main`.

## Local development

Requires Node 22.12+ (Astro 7).

```bash
npm install          # install dependencies (also installs the git hooks via lefthook)
npm run dev          # live-reloading dev server (http://localhost:4321)
npm run build        # build into dist/ + generate the Pagefind search index
npm run preview      # serve the built dist/ locally (search works here, not in dev)
```

## Code quality

Linting, formatting, type-checking, and tests are wired up and enforced both locally
(pre-push) and in CI. The tooling configs live in [`.config/`](.config) to keep the repo
root uncluttered.

```bash
npm run typecheck    # astro check (types across .astro + .ts)
npm run lint         # eslint (flat config; astro + typescript-eslint)
npm run lint:fix     # eslint --fix
npm run format       # prettier --write (formats the repo)
npm run format:check # prettier --check (CI/pre-push gate)
npm test             # vitest run (unit tests for src/lib helpers)
```

- **`.config/lefthook.yml`** — a `pre-push` hook runs typecheck + lint + format:check + test
  in parallel, so failures are caught before they reach GitHub. Installed automatically by
  the `prepare` script on `npm install`; re-sync manually with `npx lefthook install`.
- **`.config/eslint.config.js`** — ESLint flat config (`js` + `typescript-eslint` +
  `eslint-plugin-astro`, with `eslint-config-prettier` last). Type-aware linting is off;
  `astro check` provides the type checking.
- **`.config/prettierrc.json`** + [`.prettierignore`](.prettierignore) — Prettier with
  `prettier-plugin-astro`. Blog content under `src/content/` is intentionally left alone.
- **`.config/vitest.config.ts`** — Vitest; tests live next to the code (`src/**/*.test.ts`).
- **`.vscode/settings.json`** points the editor's ESLint/Prettier extensions at these configs.

## How publishing works

`.github/workflows/publish.yml` runs on every push/PR to `main`:

1. **`checks`** — `npm ci`, then `npm run typecheck`, `lint`, `format:check`, and `test`.
   This mirrors the local lefthook pre-push hook and gates everything below.
2. **`build`** (needs `checks`) — `npm run build` runs `astro build` into `dist/`, then
   `pagefind --site dist` writes the full-text search index into `dist/pagefind/`.
3. **`deploy`** (needs `build`) — the `dist/` artifact is deployed to GitHub Pages (only on
   `main`; PRs run `checks` + `build` as status checks and stop there).

Pages source must be set to **GitHub Actions** (Settings → Pages).

## Project layout

```
.config/                   tooling configs — eslint, prettier, lefthook, vitest
.github/workflows/         publish.yml (checks → build → deploy to GitHub Pages)
astro.config.mjs           integrations (React, MDX, math, code, sitemap) + site config
src/
  content.config.ts        blog content collection (glob loader + schema)
  content/blog/<slug>/      one folder per post: index.md (or .mdx) + co-located figures
  layouts/                 Base.astro (shell) · BlogPost.astro (post template)
  pages/                   index / blog / projects / cv / search / 404 · blog.xml (RSS)
  components/              Nav, Footer, Hero, SwathField (hero island), BlogList (island),
                           Figure, LinkButton, Icon
  lib/                     site config, formatting, publications (BibTeX → IEEE at build)
  styles/global.css        design tokens (palette, type scale) + base styles
references-*.bib           publications — source of truth, rendered IEEE-style on the CV
ieee.csl                   IEEE citation style used by the publications renderer
public/                    static assets served as-is (favicon)
```

## Writing posts

Each post is a folder under `src/content/blog/` with an `index.md` (or `index.mdx` if it
needs a component such as `<Figure>`). Front matter:

```yaml
---
title: 'Post title'
description: 'One or two sentences; used on the card and in the feed.'
date: '2026-06-21'
tags: [SAR, complex-valued]
draft: true # optional — drafts are built but hidden from listings/feed/sitemap
---
```

Put figures and data alongside the post inside its folder. Posts can carry LaTeX math
(`$…$` / `$$…$$`, rendered by KaTeX) and syntax-highlighted code blocks (Expressive Code).

## Publications

The CV's publication lists are generated at build time from the four `references-*.bib`
files using `ieee.csl` (see `src/lib/publications.ts`) — edit the `.bib` files, not the
rendered lists. Each file becomes its own independently numbered IEEE list.
