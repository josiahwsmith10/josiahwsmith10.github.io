// Single source of truth for site-wide identity, nav, and social links.
export const site = {
  name: 'Josiah W. Smith',
  shortName: 'Josiah Smith',
  role: 'Applied AI Scientist, Ph.D.',
  title: 'Josiah W. Smith — Applied AI Scientist',
  description:
    'SAR & geospatial machine-learning research, notes, and projects — perception models that are natively aware of the physics of their sensors.',
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
