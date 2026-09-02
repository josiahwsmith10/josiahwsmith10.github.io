import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getPublications } from './publications';

const groups = getPublications();
const entries = groups.flatMap((g) => g.entries);

describe('publications', () => {
  it('renders every BibTeX file as its own numbered list', () => {
    expect(groups.map((g) => g.id)).toEqual(['journal', 'letter', 'conference', 'preprint']);
    for (const g of groups) {
      expect(g.entries.length).toBeGreaterThan(0);
      expect(g.entries.map((e) => e.marker)).toEqual(g.entries.map((_, i) => `[${i + 1}]`));
    }
  });

  it('links the DOI of every reference', () => {
    for (const e of entries) {
      expect(e.html, e.id).toMatch(/<a href="https:\/\/doi\.org\/10\.[^"]+"/);
      // The reference still reads as IEEE prose — the link wraps the DOI, nothing else.
      expect(e.html, e.id).not.toMatch(/doi: <a[^>]*>\s*</);
    }
  });

  it('points every write-up link at a post that exists', () => {
    const posts = entries
      .flatMap((e) => e.links)
      .filter((l) => !l.external)
      .map((l) => l.href);
    expect(posts.length).toBeGreaterThan(0);
    for (const href of posts) {
      const slug = href.replace(/^\/blog\//, '');
      const dir = new URL(`../content/blog/${slug}/`, import.meta.url);
      expect(existsSync(dir), href).toBe(true);
    }
  });

  it('uses absolute https urls for external links and never repeats a destination', () => {
    for (const e of entries) {
      for (const l of e.links) {
        if (l.external) expect(l.href, `${e.id} ${l.label}`).toMatch(/^https:\/\//);
      }
      const hrefs = e.links.map((l) => l.href);
      expect(new Set(hrefs).size, e.id).toBe(hrefs.length);
    }
  });

  it('does not add an arXiv link when the DOI already resolves to arXiv', () => {
    for (const e of entries) {
      if (!/doi\.org\/10\.48550/.test(e.html)) continue;
      expect(
        e.links.map((l) => l.label),
        e.id,
      ).not.toContain('arXiv');
    }
  });
});
