import { expect, test } from "vitest";
import { configSchema, parseCriteria, sprintWeek, workdays } from "../src";

const config = configSchema.parse({ semesterstart: "2026-09-08", sprintlengte_weken: 2 });

test.each([
  ["2026-09-08", { sprint: 1, week: 1 }],
  ["2026-09-14", { sprint: 1, week: 1 }],
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
