import { expect, test } from "vitest";
import { createResolver, parseEntry, validateEntry } from "../src";
import { config, fixtureFiles, loadEntries } from "./helpers";

const entries = loadEntries();
const context = {
  resolver: createResolver(entries),
  files: fixtureFiles(),
  doelen: [...new Set(entries.flatMap((e) => e.doelen))],
};

const codesFor = (id: string) =>
  validateEntry(entries.find((e) => e.id === id)!, context).map((d) => d.code);

test("a clean entry has no diagnostics", () => {
  expect(codesFor("logboek/daily/2026-09-08")).toEqual([]);
});

test("check-in labels and unresolved references", () => {
  expect(codesFor("logboek/daily/2026-09-15")).toEqual(["span-in-check-in", "unresolved-ref"]);
});

test("missing attachments and unresolved references in evidence", () => {
  expect(codesFor("logboek/evidence/2026-09-12-sprintreview")).toEqual(["unresolved-ref", "missing-attachment"]);
});

test("unknown skills, missing levels and similar goals", () => {
  const source = [
    "---",
    "date: 2026-09-20",
    "vaardigheden: [samenwerkn]",
    "doelen: [js-interops]",
    "---",
    "",
    "[a]{.plannen} [b]{.reflecteer niveau=2} [c]{.plannen niveau=7}",
  ].join("\n");
  const { entry } = parseEntry("logboek/daily/2026-09-20.md", source, config);
  expect(validateEntry(entry, context).map((d) => d.code)).toEqual([
    "unknown-vaardigheid",
    "invalid-niveau",
    "unknown-vaardigheid",
    "invalid-niveau",
    "similar-doel",
  ]);
});
