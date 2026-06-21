# josiahwsmith10.github.io

Source for my personal website + blog — [josiahwsmith10.github.io](https://josiahwsmith10.github.io).
Built with [Quarto](https://quarto.org), managed with [uv](https://docs.astral.sh/uv/),
and published to GitHub Pages automatically on every push to `main`.

## Local development

Quarto itself is pinned in `uv.lock` via the `quarto-cli` package, so you don't need a
system-wide Quarto install — `uv` provides it.

```bash
uv sync                  # install Quarto + Python deps (downloads the Quarto binary once)
uv run quarto preview    # live-reloading local preview
uv run quarto render     # one-off build into _site/
```

## How publishing works

`.github/workflows/publish.yml` runs on every push/PR to `main`:

1. `astral-sh/setup-uv` + `uv sync --locked` — reproduces the exact Quarto + Python versions.
2. `uv run quarto render` — builds the site into `_site/`.
3. The `_site/` artifact is deployed to GitHub Pages (only on `main`; PRs are build-checks).

Pages source must be set to **GitHub Actions** (Settings → Pages).

## Writing posts

Each post is a folder under `posts/` with an `index.qmd`. New posts:

```bash
mkdir posts/my-post && $EDITOR posts/my-post/index.qmd
```

Front matter needs at least a `title` and `date`. Drafts carry `draft: true` and are
excluded from the published site — remove that line to publish. Put figures, data, and
notebooks alongside the post inside its folder.

### Executable code & the freeze cache

`execute.freeze: auto` (in `_quarto.yml`) caches code-chunk results in `_freeze/`, which is
committed to the repo. Re-render locally after changing code to refresh the cache; CI then
assembles HTML from the cache without re-running code or needing data access.

## Layout

```
_quarto.yml          site config (navbar, theme, freeze)
index.qmd            home / about
blog.qmd             blog listing
projects.qmd         projects
cv.qmd               CV / publications
posts/               blog posts (one folder each)
styles.css           custom styling
profile.svg          placeholder avatar (replace with a real photo)
.github/workflows/   CI publish pipeline
```
