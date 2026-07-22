export type LessonAvailability = 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'UNSCHEDULED';

export interface LessonWindow {
  access_starts_at?: string | null;
  access_ends_at?: string | null;
  scheduled_at?: string | null;
}

export function getLessonAvailability(lesson: LessonWindow, now = new Date()): LessonAvailability {
  const startsAt = lesson.access_starts_at || lesson.scheduled_at;
  if (!startsAt) return 'UNSCHEDULED';

  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime()) || now < start) return 'UPCOMING';

  if (!lesson.access_ends_at) return 'UNSCHEDULED';
  const end = new Date(lesson.access_ends_at);
  if (Number.isNaN(end.getTime()) || now >= end) return 'ENDED';

  return 'ACTIVE';
}

export function isLessonActive(lesson: LessonWindow, now = new Date()): boolean {
  return getLessonAvailability(lesson, now) === 'ACTIVE';
}
