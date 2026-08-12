import { toLocalIsoString } from '@/utils/date.utils';
import { iso8601Field } from '@/lib/validation';

describe('toLocalIsoString', () => {
  it('converts a datetime-local value to valid ISO-8601 with the local offset', () => {
    const out = toLocalIsoString('2026-08-13T11:30');

    expect(out).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}$/);
    // Must satisfy the same strict schema the backend validates against.
    expect(iso8601Field.safeParse(out).success).toBe(true);
  });

  it('keeps the user-picked wall-clock time', () => {
    const out = toLocalIsoString('2026-08-13T11:30');
    expect(out.startsWith('2026-08-13T11:30')).toBe(true);
  });

  it('preserves the exact instant (no silent timezone shift)', () => {
    const out = toLocalIsoString('2026-08-13T11:30');
    expect(new Date(out).getTime()).toBe(new Date('2026-08-13T11:30').getTime());
  });

  it('re-serialises an already-ISO string to the same instant with the local offset', () => {
    const out = toLocalIsoString('2026-08-13T06:00:00.000Z');
    expect(iso8601Field.safeParse(out).success).toBe(true);
    expect(new Date(out).getTime()).toBe(new Date('2026-08-13T06:00:00.000Z').getTime());
  });

  it('returns empty string for empty or invalid input', () => {
    expect(toLocalIsoString('')).toBe('');
    expect(toLocalIsoString('garbage')).toBe('');
    expect(toLocalIsoString('13.08.2026')).toBe('');
  });
});
