import { expect, test } from "vitest";
import {
  createResolver,
  editRoadmap,
  parseRoadmap,
  roadmapStatus,
  validateEntry,
  validateRoadmap,
} from "../src";
import { config, entry, fixtureFiles, loadEntries, readRoadmap, readRoadmapSource } from "./helpers";

const TODAY = "2026-09-24";

test("items resolve week numbers, and a range starts on Monday", () => {
  const roadmap = readRoadmap();
  expect(roadmap.issues).toEqual([]);
  expect(roadmap.items[0]).toEqual({
    index: 0,
    titel: "Tokenlaag in app.css",
    start: "2026-09-07",
    eind: "2026-10-02",
    meerdaags: true,
    doel: "tokens",
    vaardigheden: [],
    bewijs: [],
    afgerond: null,
  });
  expect(roadmap.items[5]).toMatchObject({ start: "2026-09-25", eind: "2026-09-25", meerdaags: false, doel: null });
  expect(roadmap.refs).toEqual(["Sprintreview sprint 1"]);
});

test("one broken item is reported without dropping the rest", () => {
  const roadmap = parseRoadmap(
    [
      "---",
      "planning:",
      "  - titel: Verkeerd om",
      "    datum: week 3",
      "    tot: week 2",
      "  - titel: Goed",
      "    datum: week 2",
      "    vaardigheden: [plannen, vliegen]",
      "  - datum: week 3",
      "---",
    ].join("\n"),
    config,
  );
  expect(roadmap.items.map((i) => i.titel)).toEqual(["Goed"]);
  expect(roadmap.items[0]!.vaardigheden).toEqual(["plannen"]);
  expect(roadmap.issues.map((i) => i.code)).toEqual(["invalid-roadmap", "unknown-vaardigheid", "invalid-roadmap"]);
});

test("an empty file is an empty roadmap", () => {
  expect(parseRoadmap("# Roadmap\n", config)).toEqual({ items: [], refs: [], issues: [] });
});

test("status follows today, completion and linked entries", () => {
  const entries = loadEntries();
  const status = roadmapStatus(readRoadmap(), entries, createResolver(entries), TODAY);

  expect(status.items.map((i) => [i.item.titel, i.status, i.bewijsAanwezig])).toEqual([
    ["Tokenlaag in app.css", "bezig", false],
    ["JS-interop opgeschoond", "verlopen", false],
    ["Advies architectuur", "gepland", false],
    ["ADR tokenlaag vastgelegd", "afgerond", false],
    ["Sprintreview sprint 1 gegeven", "verlopen", true],
    ["Roadmap afgestemd met opdrachtgever", "gepland", false],
    ["Evaluatie Plannen N2", "gepland", false],
  ]);
  expect(status.items[0]!.entries.map((e) => e.id)).toEqual(["logboek/daily/2026-09-09"]);
  expect(status.items[4]!.bewijsstukken[0]!.entry?.id).toBe("logboek/evidence/2026-09-12-sprintreview");
  expect(status.ongepland).toEqual(expect.arrayContaining(["onboarding", "panel-layout", "sprintreview"]));
  expect(status.ongepland).not.toContain("tokens");
});

test("missing evidence is only a problem once the item is finished", () => {
  const roadmap = parseRoadmap(
    [
      "---",
      "planning:",
      "  - titel: Gepland",
      "    datum: 2026-10-01",
      "    bewijs: [Komt nog]",
      "  - titel: Klaar",
      "    datum: 2026-09-10",
      "    bewijs: [Bestaat niet]",
      "    afgerond: 2026-09-10",
      "---",
      "",
      "@[Ook niet]",
    ].join("\n"),
    config,
  );
  const diagnostics = validateRoadmap(roadmap, createResolver(loadEntries()));
  expect(diagnostics.map((d) => [d.entryId, d.code, d.message])).toEqual([
    ["logboek/roadmap", "unresolved-ref", '"Klaar" is afgerond, maar bewijs "Bestaat niet" bestaat niet'],
    ["logboek/roadmap", "unresolved-ref", "Verwijzing @Ook niet wijst nergens heen"],
  ]);
});

test("an entry goal missing from the roadmap is flagged", () => {
  const entries = loadEntries();
  const context = {
    resolver: createResolver(entries),
    files: fixtureFiles(),
    doelen: [],
    gepland: new Set(readRoadmap().items.flatMap((i) => (i.doel ? [i.doel] : []))),
  };
  const codes = validateEntry(entry("logboek/daily/2026-09-08"), context).map((d) => d.code);
  expect(codes).toEqual(["ongepland-doel"]);
});

test("adding to an empty roadmap writes block items with inline lists", () => {
  const next = editRoadmap(null, [
    { action: "add", fields: { titel: "Advies", datum: "2026-10-01", tot: "week 8", doel: "advies" } },
    { action: "add", fields: { titel: "Review", datum: "2026-10-09", bewijs: ["Roadmap v1"], vaardigheden: ["plannen"] } },
  ]);
  expect(next).toMatch(
    /^---\nplanning:\n  - titel: Advies\n    datum: 2026-10-01\n    tot: week 8\n    doel: advies\n  - titel: Review\n    datum: 2026-10-09\n    bewijs: \[Roadmap v1\]\n    vaardigheden: \[plannen\]\n---\n\n# Roadmap/,
  );
  const roadmap = parseRoadmap(next, config);
  expect(roadmap.issues).toEqual([]);
  expect(roadmap.items[0]).toMatchObject({ start: "2026-10-01", eind: "2026-10-30", meerdaags: true });
});

test("an update only touches the given fields and keeps comments and week numbers", () => {
  const source = "---\nplanning:\n  - datum: week 3 # vrijdag\n    titel: Oud\n    afgerond: 2026-09-20\n---\n\nTekst\n";
  const next = editRoadmap(source, [{ action: "update", index: 0, fields: { titel: "Nieuw", afgerond: null } }]);
  expect(next).toBe("---\nplanning:\n  - datum: week 3 # vrijdag\n    titel: Nieuw\n---\n\nTekst\n");
});

test("removing an item keeps the rest in order", () => {
  const next = editRoadmap(readRoadmapSource(), [{ action: "remove", index: 1 }]);
  expect(parseRoadmap(next, config).items.map((i) => i.titel).slice(0, 3)).toEqual([
    "Tokenlaag in app.css",
    "Advies architectuur",
    "ADR tokenlaag vastgelegd",
  ]);
});

test("editing an item that does not exist fails", () => {
  expect(() => editRoadmap(null, [{ action: "remove", index: 0 }])).toThrow("geen lijst");
  expect(() => editRoadmap(readRoadmapSource(), [{ action: "update", index: 9, fields: {} }])).toThrow("bestaat niet");
});
