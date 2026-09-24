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
