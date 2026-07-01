// Shared formatting helpers.

export function readingTime(body: string | undefined): number {
  if (!body) return 1;
  // Strip code fences and math so estimates track prose, not symbols.
  const text = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/[#>*`_\[\]()]/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(date: Date): string {
  return DATE_FMT.format(date);
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
