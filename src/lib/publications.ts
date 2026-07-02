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

export interface PubGroup {
  id: string;
  label: string;
  html: string;
}

function renderBib(bib: string): string {
  return new Cite(bib).format('bibliography', {
    format: 'html',
    template: 'ieee-local',
    lang: 'en-US',
  });
}

const groups: { id: string; label: string; bib: string }[] = [
  { id: 'journal', label: 'Journal articles', bib: journalBib },
  { id: 'letter', label: 'Letters', bib: letterBib },
  { id: 'conference', label: 'Conference papers', bib: conferenceBib },
  { id: 'preprint', label: 'Dissertation, preprints & software', bib: preprintBib },
];

export function getPublications(): PubGroup[] {
  return groups.map((g) => ({ id: g.id, label: g.label, html: renderBib(g.bib) }));
}
