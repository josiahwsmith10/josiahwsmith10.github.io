// Single source of truth for site-wide identity, nav, and social links.
export const site = {
  name: 'Josiah Smith',
  shortName: 'Josiah Smith',
  role: 'Applied AI Scientist, Ph.D.',
  title: 'Josiah Smith — Applied AI Scientist',
  description:
    'Research notes and projects from Josiah Smith, Ph.D., on deep learning for radar and satellite sensing: SAR, complex-valued neural networks, and geospatial foundation models.',
  url: 'https://josiahwsmith10.github.io',
  email: 'josiahsmithphd@gmail.com',
} as const;

export const nav = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/projects', label: 'Projects' },
  { href: '/cv', label: 'CV' },
] as const;

export const socials = [
  { key: 'github', label: 'GitHub', href: 'https://github.com/josiahwsmith10' },
  { key: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/josiahwsmith/' },
  {
    key: 'scholar',
    label: 'Google Scholar',
    href: 'https://scholar.google.com/citations?user=tZAFU0cAAAAJ',
  },
  { key: 'email', label: 'Email', href: 'mailto:josiahsmithphd@gmail.com' },
] as const;
