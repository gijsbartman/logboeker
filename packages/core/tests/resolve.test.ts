import { expect, test } from "vitest";
import { createResolver } from "../src";
import { loadEntries } from "./helpers";

const resolver = createResolver(loadEntries());

test("dates resolve to logs", () => {
  expect(resolver.resolve("2026-09-09")?.id).toBe("logboek/daily/2026-09-09");
});

test("names resolve to titles, ignoring case", () => {
  expect(resolver.resolve("adr 001 tokenlaag in APP.css")?.id).toBe("logboek/evidence/2026-09-09-adr-tokenlaag");
});

test("portflow_naam wins over a title", () => {
  const [a, b] = loadEntries();
  const custom = createResolver([
    { ...a!, title: "Gedeeld", portflowNaam: null },
    { ...b!, title: "Anders", portflowNaam: "Gedeeld" },
  ]);
  expect(custom.resolve("Gedeeld")?.id).toBe(b!.id);
});

test("the file named after the date wins among logs of that day", () => {
  const [log] = loadEntries().filter((e) => e.kind === "log");
  const extra = { ...log!, id: `${log!.id}-sprintreview` };
  expect(createResolver([extra, log!]).resolve(log!.date!)?.id).toBe(log!.id);
});

test("backlinks and unresolved references", () => {
  expect(resolver.backlinks("logboek/daily/2026-09-09").map((e) => e.id)).toEqual(["logboek/daily/2026-09-15"]);
  expect(resolver.unresolved).toEqual(
    expect.arrayContaining([
      { from: "logboek/daily/2026-09-15", key: "onbekend" },
      { from: "logboek/evidence/2026-09-12-sprintreview", key: "ADR 001 Tokenlaag" },
    ]),
  );
});
