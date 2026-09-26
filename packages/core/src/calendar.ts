import type { Config } from "./schema";

const DAY_MS = 86_400_000;

export interface SprintWeek {
  sprint: number;
  week: number;
}

// Weeks run Monday to Sunday, counted from the week the semester starts in.
function firstMonday(config: Config): number | null {
  if (!config.semesterstart) return null;
  const start = Date.parse(config.semesterstart);
  if (!Number.isFinite(start)) return null;
  return start - ((new Date(start).getUTCDay() + 6) % 7) * DAY_MS;
}

export function sprintWeek(date: string, config: Config): SprintWeek | null {
  const monday = firstMonday(config);
  const day = Date.parse(date);
  if (monday === null || !Number.isFinite(day) || day < Date.parse(config.semesterstart!)) return null;

  const week = Math.floor((day - monday) / DAY_MS / 7) + 1;
  const sprint = Math.floor((week - 1) / config.sprintlengte_weken) + 1;
  return { sprint, week };
}

export function workdays(date: string, config: Config): number | null {
  if (!config.semesterstart) return null;
  const start = Date.parse(config.semesterstart);
  const end = Date.parse(date);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;

  let count = 0;
  for (let day = start; day <= end; day += DAY_MS) {
    const weekday = new Date(day).getUTCDay();
    if (weekday !== 0 && weekday !== 6) count++;
  }
  return count;
}

export interface WeekRange {
  start: string;
  end: string;
}

export interface SemesterWeek extends SprintWeek, WeekRange {}

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function weekRange(week: number, config: Config): WeekRange | null {
  const monday = firstMonday(config);
  if (monday === null || !Number.isInteger(week) || week < 1) return null;
  const start = monday + (week - 1) * 7 * DAY_MS;
  return { start: isoDay(start), end: isoDay(start + 4 * DAY_MS) };
}

export function semesterWeeks(config: Config): SemesterWeek[] {
  return Array.from({ length: config.semesterlengte_weken }, (_, i) => i + 1).flatMap((week) => {
    const range = weekRange(week, config);
    if (!range) return [];
    return [{ week, sprint: Math.floor((week - 1) / config.sprintlengte_weken) + 1, ...range }];
  });
}
