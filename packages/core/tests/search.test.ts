import { expect, test } from "vitest";
import { createSearchIndex } from "../src";
import { loadEntries } from "./helpers";

const index = createSearchIndex(loadEntries(), (name) => (name.endsWith(".pptx") ? "demo van de tokenlaag" : ""));
const ids = (query: string) => index.search(query).map((hit) => hit.entry.id);

test("finds body text, with title matches ranked above body-only matches", () => {
  const found = ids("tokenlaag");
  expect(found.slice(0, 2).sort()).toEqual(["logboek/daily/2026-09-09", "logboek/evidence/2026-09-09-adr-tokenlaag"]);
  expect(found).toContain("logboek/evidence/2026-09-12-sprintreview");
});

test("prefix and typo tolerant", () => {
  expect(ids("interop")).toContain("logboek/daily/2026-09-08");
  expect(ids("onbording")).toContain("logboek/daily/2026-09-08");
});

test("ignores diacritics and matches skill labels", () => {
  expect(ids("overzicht creeren")).toContain("logboek/daily/2026-09-08");
  expect(ids("overzicht creëren")).toContain("logboek/daily/2026-09-08");
});

test("all words must match", () => {
  expect(ids("sprintreview onboarding")).toEqual([]);
});

test("searches attachment text", () => {
  expect(ids("demo")).toContain("logboek/evidence/2026-09-12-sprintreview");
});

test("snippets show the match without markdown syntax", () => {
  const [hit] = index.search("wrapper");
  expect(hit!.snippet).toContain("typed interop wrapper");
  expect(hit!.snippet).not.toContain("{.");
});
