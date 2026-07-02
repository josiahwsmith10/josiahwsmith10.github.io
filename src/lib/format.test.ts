import { describe, expect, it } from 'vitest';
import { formatDate, isoDate, readingTime } from './format';

describe('readingTime', () => {
  it('returns at least 1 minute for empty or missing input', () => {
    expect(readingTime(undefined)).toBe(1);
    expect(readingTime('')).toBe(1);
  });

  it('estimates ~200 words per minute', () => {
    const body = Array.from({ length: 400 }, () => 'word').join(' ');
    expect(readingTime(body)).toBe(2);
  });

  it('ignores fenced code and display math when estimating prose', () => {
    const prose = Array.from({ length: 200 }, () => 'word').join(' ');
    const noise = '```\n' + 'code '.repeat(500) + '```\n$$' + 'x '.repeat(500) + '$$';
    expect(readingTime(`${prose}\n${noise}`)).toBe(1);
  });
});

describe('formatDate', () => {
  it('formats in UTC as "Mon D, YYYY"', () => {
    expect(formatDate(new Date('2026-06-21T00:00:00Z'))).toBe('Jun 21, 2026');
  });

  it('is timezone-stable at day boundaries', () => {
    // 23:30 UTC must render as that same calendar day, not roll forward/back.
    expect(formatDate(new Date('2026-01-01T23:30:00Z'))).toBe('Jan 1, 2026');
  });
});

describe('isoDate', () => {
  it('returns the YYYY-MM-DD prefix', () => {
    expect(isoDate(new Date('2026-06-21T12:34:56Z'))).toBe('2026-06-21');
  });
});
