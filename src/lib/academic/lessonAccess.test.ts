import { describe, expect, it } from 'vitest';
import { getLessonAvailability, isLessonActive } from './lessonAccess';

const now = new Date('2026-07-22T12:00:00.000Z');

describe('lesson access windows', () => {
  it('classifies future, active and finished lessons deterministically', () => {
    expect(getLessonAvailability({ access_starts_at: '2026-07-22T13:00:00.000Z', access_ends_at: '2026-07-22T14:00:00.000Z' }, now)).toBe('UPCOMING');
    expect(getLessonAvailability({ access_starts_at: '2026-07-22T11:00:00.000Z', access_ends_at: '2026-07-22T13:00:00.000Z' }, now)).toBe('ACTIVE');
    expect(getLessonAvailability({ access_starts_at: '2026-07-22T09:00:00.000Z', access_ends_at: '2026-07-22T11:00:00.000Z' }, now)).toBe('ENDED');
  });

  it('does not make an unscheduled or incomplete window available', () => {
    expect(getLessonAvailability({}, now)).toBe('UNSCHEDULED');
    expect(isLessonActive({ scheduled_at: '2026-07-22T11:00:00.000Z' }, now)).toBe(false);
  });
});
