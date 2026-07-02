// @citation-js/* packages ship no type declarations. They're used only at build
// time (see src/lib/publications.ts) to render the IEEE bibliography, so an ambient
// `any` module declaration is enough to satisfy the type checker.
declare module '@citation-js/core';
declare module '@citation-js/plugin-bibtex';
declare module '@citation-js/plugin-csl';
