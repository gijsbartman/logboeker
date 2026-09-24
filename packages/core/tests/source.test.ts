import { expect, test } from "vitest";
import { checkInRange, formatSpanAttrs, parseSpanAttrs, scanSource } from "../src";

const slice = (text: string, from: number, to: number) => text.slice(from, to);

test("spans with their full range and text range", () => {
  const text = "Before [the **passage**]{.samenwerken niveau=2} after.";
  const [span] = scanSource(text).spans;
  expect(slice(text, span!.from, span!.to)).toBe("[the **passage**]{.samenwerken niveau=2}");
  expect(slice(text, span!.textFrom, span!.textTo)).toBe("the **passage**");
  expect(span!.attrs).toMatchObject({ vaardigheden: ["samenwerken"], niveau: 2 });
});

test("a reference inside a span", () => {
  const text = "[Shown in @[ADR 001] today]{.boodschap-delen niveau=2}";
  const { spans, refs } = scanSource(text);
  expect(spans).toHaveLength(1);
  expect(refs).toEqual([{ from: 10, to: 20, kind: "entry", key: "ADR 001" }]);
});

test("every reference form, with file references kept apart", () => {
  const text = "See @2026-09-17, @[Some name], @adr-001 and @{deck.pptx}.";
  expect(scanSource(text).refs.map((r) => [r.kind, r.key, slice(text, r.from, r.to)])).toEqual([
    ["entry", "2026-09-17", "@2026-09-17"],
    ["entry", "Some name", "@[Some name]"],
    ["entry", "adr-001", "@adr-001"],
    ["file", "deck.pptx", "@{deck.pptx}"],
  ]);
});

test("nothing inside inline or fenced code", () => {
  const text = "`[x]{.plannen niveau=2} @2026-09-17`\n\n```\n[y]{.plannen niveau=1}\n@{a.pdf}\n```\n";
  expect(scanSource(text)).toEqual({ spans: [], refs: [] });
});

test("a span does not run across paragraphs", () => {
  expect(scanSource("[open\n\nclosed]{.plannen niveau=2}").spans).toEqual([]);
});

test("links, task boxes and plain brackets are not spans", () => {
  expect(scanSource("[a](https://x.nl) - [ ] todo array[0] [b]{niveau=2}").spans).toEqual([]);
});

test("span attributes format back to the source syntax", () => {
  const raw = ".plannen .kwalitatief-product-maken .bt-software-realiseren niveau=3";
  expect(formatSpanAttrs(parseSpanAttrs(raw)!)).toBe(raw);
  expect(formatSpanAttrs({ vaardigheden: ["reflecteren"], beroepstaken: [], niveau: null })).toBe(".reflecteren");
});

test("the check-in section runs until the next heading of the same level", () => {
  const text = "# T\n\n## Wat ga ik doen vandaag?\n\n- a\n\n### Hulpvragen\n\n- b\n\n## Wat heb ik gedaan vandaag?\n\nx\n";
  const range = checkInRange(text)!;
  expect(text.slice(range.from, range.to)).toBe("## Wat ga ik doen vandaag?\n\n- a\n\n### Hulpvragen\n\n- b\n\n");
  expect(checkInRange("# T\n\n## Wat heb ik gedaan vandaag?\n")).toBeNull();
});
