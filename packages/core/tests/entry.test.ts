import { describe, expect, test } from "vitest";
import { parseEntry } from "../src";
import { config, entry } from "./helpers";

describe("parseEntry", () => {
  test("a daily log", () => {
    const log = entry("logboek/daily/2026-09-08");
    expect(log).toMatchObject({
      kind: "log",
      date: "2026-09-08",
      sprint: 1,
      week: 1,
      title: "Onboarding codebase en eerste interop-verkenning",
      doelen: ["js-interop", "onboarding"],
      beroepstaken: ["software-realiseren"],
    });
    expect(log.spans).toHaveLength(3);
  });

  test("skills from spans are merged with the frontmatter", () => {
    expect(entry("logboek/daily/2026-09-08").vaardigheden).toEqual([
      "plannen",
      "overzicht-creeren",
      "kwalitatief-product-maken",
      "flexibel-opstellen",
    ]);
  });

  test("evidence takes its title from titel", () => {
    expect(entry("logboek/evidence/2026-09-09-adr-tokenlaag")).toMatchObject({
      kind: "bewijs",
      title: "ADR 001 Tokenlaag in app.css",
    });
  });

  test("attachments combine bestanden and file references without duplicates", () => {
    expect(entry("logboek/evidence/2026-09-12-sprintreview").attachments).toEqual([
      "2026-09-12-sprintreview.pptx",
      "2026-09-12-notulen.pdf",
    ]);
  });

  test("spans under the check-in heading are marked", () => {
    const spans = entry("logboek/daily/2026-09-15").spans;
    expect(spans.map((s) => [s.text, s.inCheckIn])).toEqual([
      ["Tokens uitwerken", true],
      ["De review afgerond en de opmerkingen verwerkt in @[ADR 001 Tokenlaag in app.css].", false],
    ]);
  });

  test("sprint and week are always derived, never read from frontmatter", () => {
    const source = "---\ndate: 2026-09-23\nsprint: 9\nweek: 9\n---\n\n# X\n";
    expect(parseEntry("logboek/daily/2026-09-23.md", source, config).entry).toMatchObject({ sprint: 2, week: 3 });
  });

  test("an invalid field is reported without losing the others", () => {
    const source = "---\ndate: 17-09-2026\ndoelen: [a]\n---\n\n# X\n";
    const { entry: parsed } = parseEntry("logboek/daily/2026-09-17.md", source, config);
    expect(parsed.doelen).toEqual(["a"]);
    expect(parsed.date).toBe("2026-09-17");
    expect(parsed.frontmatterIssues.map((i) => i.field)).toEqual(["date"]);
  });

  test("broken YAML still yields an entry", () => {
    const { entry: parsed } = parseEntry("logboek/daily/2026-09-17.md", "---\ndoelen: [a\n---\n\n# Titel\n", config);
    expect(parsed.title).toBe("Titel");
    expect(parsed.frontmatterIssues).toHaveLength(1);
  });

  test("rejects paths outside the entry folders", () => {
    expect(() => parseEntry("data/config.md", "", config)).toThrow();
  });
});
