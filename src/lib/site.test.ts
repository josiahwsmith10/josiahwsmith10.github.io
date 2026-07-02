import { describe, expect, it } from 'vitest';
import { nav, site, socials } from './site';

describe('site config', () => {
  it('exposes a canonical https url with no trailing slash', () => {
    expect(site.url).toMatch(/^https:\/\//);
    expect(site.url.endsWith('/')).toBe(false);
  });

  it('nav items use root-relative hrefs and unique labels', () => {
    for (const item of nav) expect(item.href.startsWith('/')).toBe(true);
    const labels = nav.map((n) => n.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('every social link has a key, label, and a usable href', () => {
    for (const s of socials) {
      expect(s.key).toBeTruthy();
      expect(s.label).toBeTruthy();
      expect(s.href).toMatch(/^(https?:|mailto:)/);
    }
  });
});
