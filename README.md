# josiahwsmith10.github.io

Source for my personal website + blog — [josiahwsmith10.github.io](https://josiahwsmith10.github.io).
Built with [Astro](https://astro.build) (static output, React islands where an
interaction earns it) and published to GitHub Pages automatically on every push to `main`.

## Local development

Requires Node 20+.

```bash
npm install          # install dependencies
npm run dev          # live-reloading dev server (http://localhost:4321)
npm run build        # build into dist/ + generate the Pagefind search index
npm run preview      # serve the built dist/ locally (search works here, not in dev)
```

## How publishing works

`.github/workflows/publish.yml` runs on every push/PR to `main`:

1. `npm ci` — install the locked dependencies.
2. `npm run build` — `astro build` into `dist/`, then `pagefind --site dist` writes the
   full-text search index into `dist/pagefind/`.
3. The `dist/` artifact is deployed to GitHub Pages (only on `main`; PRs are build-checks).

Pages source must be set to **GitHub Actions** (Settings → Pages).

## Project layout

```
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
title: "Post title"
description: "One or two sentences; used on the card and in the feed."
date: "2026-06-21"
tags: [SAR, complex-valued]
draft: true            # optional — drafts are built but hidden from listings/feed/sitemap
---
```

Put figures and data alongside the post inside its folder. Posts can carry LaTeX math
(`$…$` / `$$…$$`, rendered by KaTeX) and syntax-highlighted code blocks (Expressive Code).

## Publications

The CV's publication lists are generated at build time from the four `references-*.bib`
files using `ieee.csl` (see `src/lib/publications.ts`) — edit the `.bib` files, not the
rendered lists. Each file becomes its own independently numbered IEEE list.
