import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  formatDurationLabel,
  getPosterSrc,
  normalizeDisplayText,
} from '../src/utils/movieUi.js';

const sessionCardPath = path.resolve('src/components/SessionCard.jsx');

describe('main-site feature regressions', () => {
  it('formats poster and display values consistently', () => {
    expect(getPosterSrc('/poster.jpg')).toBe('https://image.tmdb.org/t/p/w342/poster.jpg');
    expect(getPosterSrc('https://cdn.example/poster.jpg')).toBe('https://cdn.example/poster.jpg');
    expect(getPosterSrc('')).toContain('via.placeholder.com/200x300');

    expect(formatDurationLabel('01:45')).toBe('1h 45min');
    expect(formatDurationLabel(null)).toBe('—');
    expect(normalizeDisplayText(' Drama ')).toBe(' Drama ');
    expect(normalizeDisplayText('')).toBe('—');
  });

  it('normalizes poster sources for protocol-relative and bare host urls', () => {
    expect(getPosterSrc('data:image/png;base64,abc123')).toBe('data:image/png;base64,abc123');
    expect(getPosterSrc('//cdn.example.com/poster.webp')).toBe('https://cdn.example.com/poster.webp');
    expect(getPosterSrc('www.example.com/poster.jpg')).toBe('https://www.example.com/poster.jpg');
    expect(getPosterSrc('cdn.example.com/poster.jpg')).toBe('https://cdn.example.com/poster.jpg');

    expect(getPosterSrc('not-a-url')).toContain('via.placeholder.com/200x300');
    expect(getPosterSrc('', 'w780')).toContain('via.placeholder.com/640x360');
    expect(getPosterSrc('', 'w500')).toContain('via.placeholder.com/300x450');
    expect(getPosterSrc('', 'w92')).toContain('via.placeholder.com/92x138');
  });

  it('keeps trailer button removed from SessionCard', () => {
    const source = fs.readFileSync(sessionCardPath, 'utf8');

    expect(source).not.toContain('session-card__trailer');
    expect(source).not.toContain('>Trailer<');
    expect(source).toContain('Buy Tickets');
  });
});
