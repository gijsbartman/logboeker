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

test("goals and milestones resolve week numbers to dates", () => {
  const roadmap = readRoadmap();
  expect(roadmap.issues).toEqual([]);
  expect(roadmap.doelen[0]).toEqual({
    index: 0,
    slug: "tokens",
    titel: "Tokenlaag in app.css",
    van: "2026-09-07",
    tot: "2026-10-02",
    afgerond: null,
  });
  expect(roadmap.mijlpalen[0]).toMatchObject({ datum: "2026-09-11", behaald: "2026-09-09", doel: "tokens", niveau: 2 });
  expect(roadmap.mijlpalen[2]).toMatchObject({ datum: "2026-09-25", bewijs: [], doel: null, behaald: null });
  expect(roadmap.refs).toEqual(["Sprintreview sprint 1"]);
});

test("one broken item is reported without dropping the rest", () => {
  const roadmap = parseRoadmap(
    [
      "---",
      "doelen:",
      "  - slug: a",
      "    van: morgen",
      "    tot: week 2",
      "mijlpalen:",
      "  - titel: Goed",
      "    datum: week 2",
      "    vaardigheden: [plannen, vliegen]",
      "    doel: b",
      "  - datum: week 3",
      "---",
    ].join("\n"),
    config,
  );
  expect(roadmap.doelen).toEqual([]);
  expect(roadmap.mijlpalen.map((m) => m.titel)).toEqual(["Goed"]);
  expect(roadmap.mijlpalen[0]!.vaardigheden).toEqual(["plannen"]);
  expect(roadmap.issues.map((i) => i.code)).toEqual([
    "invalid-roadmap",
    "unknown-vaardigheid",
    "unknown-doel",
    "invalid-roadmap",
  ]);
});

test("an empty file is an empty roadmap", () => {
  expect(parseRoadmap("# Roadmap\n", config)).toEqual({ doelen: [], mijlpalen: [], refs: [], issues: [] });
});

test("status follows today, completion dates and linked entries", () => {
  const entries = loadEntries();
  const status = roadmapStatus(readRoadmap(), entries, createResolver(entries), TODAY);

  expect(status.doelen.map((d) => [d.doel.slug, d.status])).toEqual([
    ["tokens", "bezig"],
    ["js-interop", "over-tijd"],
    ["advies", "gepland"],
  ]);
  expect(status.doelen[0]!.entries.map((e) => e.id)).toEqual(["logboek/daily/2026-09-09"]);
  expect([...status.doelen[0]!.actieveWeken]).toEqual([1]);

  expect(status.mijlpalen.map((m) => [m.status, m.bewijsAanwezig])).toEqual([
    ["behaald", false],
    ["verlopen", true],
    ["open", false],
    ["open", false],
  ]);
  expect(status.mijlpalen[1]!.bewijsstukken[0]!.entry?.id).toBe("logboek/evidence/2026-09-12-sprintreview");
  expect(status.ongepland).toEqual(expect.arrayContaining(["onboarding", "panel-layout", "sprintreview"]));
  expect(status.ongepland).not.toContain("tokens");
});

test("missing evidence is only a problem once the milestone is reached", () => {
  const roadmap = parseRoadmap(
    [
      "---",
      "mijlpalen:",
      "  - titel: Gepland",
      "    datum: 2026-10-01",
      "    bewijs: [Komt nog]",
      "  - titel: Gehaald",
      "    datum: 2026-09-10",
      "    bewijs: [Bestaat niet]",
      "    behaald: 2026-09-10",
      "---",
      "",
      "@[Ook niet]",
    ].join("\n"),
    config,
  );
  const diagnostics = validateRoadmap(roadmap, createResolver(loadEntries()));
  expect(diagnostics.map((d) => [d.entryId, d.code, d.message])).toEqual([
    ["logboek/roadmap", "unresolved-ref", 'Mijlpaal "Gehaald" is behaald, maar bewijs "Bestaat niet" bestaat niet'],
    ["logboek/roadmap", "unresolved-ref", "Verwijzing @Ook niet wijst nergens heen"],
  ]);
});

test("an entry goal missing from the roadmap is flagged", () => {
  const entries = loadEntries();
  const context = {
    resolver: createResolver(entries),
    files: fixtureFiles(),
    doelen: [],
    gepland: new Set(readRoadmap().doelen.map((d) => d.slug)),
  };
  const codes = validateEntry(entry("logboek/daily/2026-09-08"), context).map((d) => d.code);
  expect(codes).toEqual(["ongepland-doel"]);
});

test("adding to an empty list writes block items with inline lists", () => {
  const next = editRoadmap(null, [
    { list: "doelen", action: "add", fields: { slug: "advies", titel: "Advies", van: "2026-10-01", tot: "week 8" } },
    {
      list: "mijlpalen",
      action: "add",
      fields: { titel: "Review", datum: "2026-10-09", bewijs: ["Roadmap v1"], vaardigheden: ["plannen"], niveau: null },
    },
  ]);
  expect(next).toMatch(
    /^---\ndoelen:\n  - slug: advies\n    titel: Advies\n    van: 2026-10-01\n    tot: week 8\nmijlpalen:\n  - titel: Review\n    datum: 2026-10-09\n    bewijs: \[Roadmap v1\]\n    vaardigheden: \[plannen\]\n---\n\n# Roadmap/,
  );
  const roadmap = parseRoadmap(next, config);
  expect(roadmap.issues).toEqual([]);
  expect(roadmap.doelen[0]).toMatchObject({ index: 0, slug: "advies", tot: "2026-10-30" });
});

test("an update only touches the given fields and keeps comments and week numbers", () => {
  const source = "---\nmijlpalen:\n  - datum: week 3 # vrijdag\n    titel: Oud\n    behaald: 2026-09-20\n---\n\nTekst\n";
  const next = editRoadmap(source, [
    { list: "mijlpalen", action: "update", index: 0, fields: { titel: "Nieuw", behaald: null } },
  ]);
  expect(next).toBe("---\nmijlpalen:\n  - datum: week 3 # vrijdag\n    titel: Nieuw\n---\n\nTekst\n");
});

test("removing an item keeps the rest in order", () => {
  const next = editRoadmap(readRoadmapSource(), [{ list: "mijlpalen", action: "remove", index: 1 }]);
  expect(parseRoadmap(next, config).mijlpalen.map((m) => m.titel)).toEqual([
    "ADR tokenlaag vastgelegd",
    "Roadmap afgestemd met opdrachtgever",
    "Evaluatie Plannen N2",
  ]);
});

test("editing an item that does not exist fails", () => {
  expect(() => editRoadmap(null, [{ list: "doelen", action: "remove", index: 0 }])).toThrow("geen lijst");
  expect(() =>
    editRoadmap(readRoadmapSource(), [{ list: "doelen", action: "update", index: 9, fields: {} }]),
  ).toThrow("bestaat niet");
});
