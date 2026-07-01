// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// https://astro.build
export default defineConfig({
  site: 'https://josiahwsmith10.github.io',

  integrations: [
    // Expressive Code MUST come before mdx() so code blocks inside .mdx are processed.
    expressiveCode({
      themes: ['github-light'],
      useDarkModeMediaQuery: false,
      styleOverrides: {
        borderRadius: '0px',
        borderColor: '#dbe0d8',
        codeFontFamily:
          "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        codeFontSize: '0.86rem',
        frames: {
          shadowColor: 'transparent',
          editorTabBarBorderBottomColor: '#dbe0d8',
        },
      },
    }),
    react(),
    mdx(),
    // Drafts are still built (so their URLs resolve for preview/sharing) but are
    // marked noindex and kept out of the sitemap. Keep this list in sync with
    // any post carrying `draft: true`.
    sitemap({
      filter: (page) =>
        !/\/blog\/(nisar-lband-fm-gap|guacamayasar)\/?$/.test(page) &&
        !/\/search\/?$/.test(page),
    }),
  ],

  // Math: Astro 7 markdown pipeline. Expressive Code detects this `unified()`
  // processor and pushes its highlighter into `processor.options.rehypePlugins`,
  // so keep a rehypePlugins array present. @astrojs/mdx inherits this config, so
  // do NOT also add these plugins to mdx() (they'd run twice).
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [[rehypeKatex, { strict: false, throwOnError: false }]],
    }),
  },

  vite: {
    // citation-js packages are CJS with dynamic requires; bundle them for SSR
    // so the build-time IEEE publication rendering works.
    ssr: {
      noExternal: [
        '@citation-js/core',
        '@citation-js/plugin-bibtex',
        '@citation-js/plugin-csl',
        '@citation-js/date',
        '@citation-js/name',
      ],
    },
  },
});
