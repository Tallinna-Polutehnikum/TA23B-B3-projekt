import { describe, it, expect } from 'vitest';
import { buildHallsEndpoint, createInitialSessionFormData } from '../src/utils/sessionForm.js';

describe('admin-worker-site session form feature checks', () => {
  it('builds cinema-based hall loading endpoint', () => {
    expect(buildHallsEndpoint(12)).toBe('/api/halls?cinemaId=12');
    expect(buildHallsEndpoint('5')).toBe('/api/halls?cinemaId=5');
  });

  it('provides default format and language values for new session', () => {
    const defaults = createInitialSessionFormData();

    expect(defaults.language).toBe('Estonian');
    expect(defaults.subtitles).toBe('English');
    expect(defaults.format).toBe('2D');
    expect(defaults.seatsAvailable).toBe('100');
  });
});
