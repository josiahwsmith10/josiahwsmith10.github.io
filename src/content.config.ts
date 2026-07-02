import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Blog posts live in co-located folders: src/content/blog/<slug>/index.{md,mdx}
// so figures and data stay beside the post. `generateId` strips the `/index`
// segment so routes are clean (/blog/<slug>).
const blog = defineCollection({
  loader: glob({
    pattern: '*/index.{md,mdx}',
    base: './src/content/blog',
    generateId: ({ entry }) => entry.replace(/\/index\.(md|mdx)$/, ''),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      // Quarto's `categories` are renamed to `tags` during conversion.
      tags: z.array(z.string()).default([]),
      // Co-located cover image (optional; posts currently have none).
      image: image().optional(),
      draft: z.boolean().default(false),
      // Carried over from posts/_metadata.yml default.
      author: z.string().default('Josiah Smith'),
    }),
});

export const collections = { blog };
