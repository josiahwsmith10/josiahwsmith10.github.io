// Build-time IEEE-formatted publications, rendered from the four BibTeX files
// with the repo's ieee.csl — reproducing the old Quarto multibib.lua (each
// .bib becomes its own independently [1..n]-numbered list). The source files
// are inlined via Vite `?raw` imports so this works regardless of where the
// module is bundled. Runs during `astro build`; never shipped to the client.
import { Cite, plugins } from '@citation-js/core';
import '@citation-js/plugin-bibtex';
import '@citation-js/plugin-csl';

import ieeeCsl from '../../ieee.csl?raw';
import journalBib from '../../references-journal.bib?raw';
import letterBib from '../../references-letter.bib?raw';
import conferenceBib from '../../references-conference.bib?raw';
import preprintBib from '../../references-preprint.bib?raw';

// Register the local IEEE CSL template once.
const cslConfig = plugins.config.get('@csl');
if (!cslConfig.templates.has('ieee-local')) {
  cslConfig.templates.add('ieee-local', ieeeCsl);
}

const GITHUB = 'https://github.com/josiahwsmith10';

export interface PubLink {
  label: string;
  href: string;
  external: boolean;
}

export interface PubEntry {
  /** BibTeX citekey. */
  id: string;
  /** IEEE reference number rendered by the CSL template, e.g. `[1]`. */
  marker: string;
  /** The formatted reference, with its DOI turned into a doi.org link. */
  html: string;
  links: PubLink[];
}

export interface PubGroup {
  id: string;
  label: string;
  entries: PubEntry[];
}

interface PubExtras {
  /** Slug of the write-up in src/content/blog. */
  post?: string;
  /** arXiv id; skipped when the DOI is already an arXiv DOI. */
  arxiv?: string;
  /** Repo name under github.com/josiahwsmith10, or a full URL. */
  code?: string;
  docs?: string;
}

// Per-paper links, keyed by citekey. BibTeX carries the DOI; everything else
// that makes a paper reachable (open-access preprint, code, the write-up on
// this site) lives here.
const extras: Record<string, PubExtras> = {
  smith2023multiband: {
    post: 'multiband-signal-fusion-3d-sar',
    arxiv: '2305.02017',
    code: 'multiband-fusion-all',
  },
  smith2022mimosar: {
    post: 'efficient-3d-mimo-sar-irregular',
    arxiv: '2305.02064',
    code: 'Efficient-3-D-Near-Field-MIMO-SAR-Imaging-for-Irregular-Scanning-Geometries',
  },
  smith2021fcnn: {
    post: 'fcnn-mmwave-musical-instrument',
    arxiv: '2305.01995',
    code: 'Radar-Musical-Instrument',
  },
  smith2021sterile: {
    post: 'sterile-training-hand-gesture',
    arxiv: '2305.02039',
  },
  smith2024freqest: {
    post: 'cv-swin-frequency-estimation',
    arxiv: '2309.09352',
    code: 'spectral-super-resolution-swin',
  },
  vasileiou2022icip: {
    post: 'cnn-super-resolution-mmwave-mobile',
    arxiv: '2305.02092',
  },
  smith2022vit: {
    post: 'vit-near-field-sar-array-perturbation',
    arxiv: '2305.02074',
    code: 'hybrid-freehand-imaging-ViT',
  },
  smith2020nearfield: {
    post: 'near-field-mimo-isar-mmwave',
    arxiv: '2305.02030',
  },
  smith2026thz: {
    code: 'THz-and-Sub-THz-Imaging-Toolbox',
  },
  smith2023complextorch: {
    post: 'complextorch',
    code: 'complextorch',
    docs: 'https://josiahwsmith10.github.io/complextorch/latest/',
  },
  smith2023dualradar: {
    code: 'dual-radar-gui',
  },
};

const ENTRY_RE =
  /<div class="csl-left-margin">([\s\S]*?)<\/div>\s*<div class="csl-right-inline">([\s\S]*?)<\/div>/;
const DOI_RE = /\bdoi: (10\.[^\s<]+)/;

/** Turn the CSL template's plain-text `doi: 10.…` into a doi.org link. */
function linkDoi(html: string): { html: string; doi: string } {
  let doi = '';
  const linked = html.replace(DOI_RE, (_match, raw: string) => {
    // The CSL template ends the reference with a period; keep it outside the link.
    const trailing = raw.endsWith('.') ? '.' : '';
    doi = trailing ? raw.slice(0, -1) : raw;
    return `doi: <a href="https://doi.org/${doi}" target="_blank" rel="noopener">${doi}</a>${trailing}`;
  });
  return { html: linked, doi };
}

function buildLinks(id: string, doi: string): PubLink[] {
  const extra = extras[id];
  if (!extra) return [];

  const links: PubLink[] = [];
  if (extra.post) links.push({ label: 'Write-up', href: `/blog/${extra.post}`, external: false });
  // An arXiv DOI already resolves to the abstract page, so don't repeat it.
  if (extra.arxiv && !doi.startsWith('10.48550/arXiv.')) {
    links.push({ label: 'arXiv', href: `https://arxiv.org/abs/${extra.arxiv}`, external: true });
  }
  if (extra.code) {
    const href = /^https?:\/\//.test(extra.code) ? extra.code : `${GITHUB}/${extra.code}`;
    links.push({ label: 'Code', href, external: true });
  }
  if (extra.docs) links.push({ label: 'Docs', href: extra.docs, external: true });
  return links;
}

function parseEntry(id: string, raw: string): PubEntry {
  const match = raw.match(ENTRY_RE);
  const marker = match ? match[1].replace(/<[^>]+>/g, '').trim() : '';
  const { html, doi } = linkDoi(match ? match[2] : raw);
  return { id, marker, html: html.trim(), links: buildLinks(id, doi) };
}

function renderBib(bib: string): PubEntry[] {
  const entries = new Cite(bib).format('bibliography', {
    format: 'html',
    template: 'ieee-local',
    lang: 'en-US',
    asEntryArray: true,
  }) as [string, string][];
  return entries.map(([id, html]) => parseEntry(id, html));
}

const groups: { id: string; label: string; bib: string }[] = [
  { id: 'journal', label: 'Journal articles', bib: journalBib },
  { id: 'letter', label: 'Letters', bib: letterBib },
  { id: 'conference', label: 'Conference papers', bib: conferenceBib },
  { id: 'preprint', label: 'Dissertation, preprints & software', bib: preprintBib },
];

export function getPublications(): PubGroup[] {
  return groups.map((g) => ({ id: g.id, label: g.label, entries: renderBib(g.bib) }));
}
