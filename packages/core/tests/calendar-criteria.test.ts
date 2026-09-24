import { expect, test } from "vitest";
import { configSchema, parseCriteria, semesterWeeks, sprintWeek, weekRange, workdays } from "../src";

const config = configSchema.parse({ semesterstart: "2026-09-08", sprintlengte_weken: 2 });

test.each([
  ["2026-09-08", { sprint: 1, week: 1 }],
  ["2026-09-13", { sprint: 1, week: 1 }],
  ["2026-09-14", { sprint: 1, week: 2 }],
  ["2026-09-15", { sprint: 1, week: 2 }],
  ["2026-09-22", { sprint: 2, week: 3 }],
])("sprint and week for %s", (date, expected) => {
  expect(sprintWeek(date, config)).toEqual(expected);
});

test("no sprint before the semester or without a start date", () => {
  expect(sprintWeek("2026-09-01", config)).toBeNull();
  expect(sprintWeek("2026-09-10", configSchema.parse({}))).toBeNull();
});

test.each([
  ["2026-09-08", 1],
  ["2026-09-12", 4],
  ["2026-09-14", 5],
  ["2026-09-24", 13],
])("workdays up to %s", (date, expected) => {
  expect(workdays(date, config)).toBe(expected);
});

test("no workdays before the semester or without a start date", () => {
  expect(workdays("2026-09-01", config)).toBeNull();
  expect(workdays("2026-09-10", configSchema.parse({}))).toBeNull();
});

test("a week number maps back to its workdays", () => {
  expect(weekRange(1, config)).toEqual({ start: "2026-09-07", end: "2026-09-11" });
  expect(weekRange(3, config)).toEqual({ start: "2026-09-21", end: "2026-09-25" });
  expect(weekRange(0, config)).toBeNull();
  expect(weekRange(1, configSchema.parse({}))).toBeNull();
});

test("the semester is laid out in weeks with their sprint", () => {
  const weeks = semesterWeeks(config);
  expect(weeks).toHaveLength(20);
  expect(weeks[2]).toEqual({ week: 3, sprint: 2, start: "2026-09-21", end: "2026-09-25" });
  expect(weeks.at(-1)).toMatchObject({ week: 20, sprint: 10 });
});

test("criteria are keyed by slug and level", () => {
  const book = parseCriteria({
    Samenwerken: {
      description: "Samen",
      level_description: { "3": { subtitle: "Teamgericht", description: "Je...", extra_description: null } },
    },
    "Iets onbekends": { description: "x", level_description: {} },
  });
  expect(book).toEqual({
    samenwerken: {
      description: "Samen",
      levels: { 3: { subtitle: "Teamgericht", description: "Je...", extra: null } },
    },
  });
});
