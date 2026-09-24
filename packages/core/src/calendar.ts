import type { Config } from "./schema";

const DAY_MS = 86_400_000;

export interface SprintWeek {
  sprint: number;
  week: number;
}

export function sprintWeek(date: string, config: Config): SprintWeek | null {
  if (!config.semesterstart) return null;
  const days = (Date.parse(date) - Date.parse(config.semesterstart)) / DAY_MS;
  if (!Number.isFinite(days) || days < 0) return null;

  const week = Math.floor(days / 7) + 1;
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
