import type { Nodes } from "mdast";
import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";
import { describe, expect, test } from "vitest";
import { parseMarkdown, type EntryRef, type EvidenceSpan, type FileRef } from "../src/markdown";

function collect<T extends Nodes>(markdown: string, type: T["type"]): T[] {
  const found: T[] = [];
  visit(parseMarkdown(markdown), type, (node) => {
    found.push(node as T);
  });
  return found;
}

const spans = (md: string) => collect<EvidenceSpan>(md, "evidenceSpan");
const entryRefs = (md: string) => collect<EntryRef>(md, "entryRef").map((r) => r.key);
const fileRefs = (md: string) => collect<FileRef>(md, "fileRef").map((r) => r.name);

describe("evidence spans", () => {
  test("a span with one skill and a level", () => {
    const [span] = spans("Before [the passage]{.samenwerken niveau=2} after.");
    expect(span).toMatchObject({ vaardigheden: ["samenwerken"], niveau: 2 });
    expect(toString(span)).toBe("the passage");
  });

  test("several skills and a beroepstaak", () => {
    const [span] = spans("[x]{.plannen .kwalitatief-product-maken .bt-software-realiseren niveau=3}");
    expect(span).toMatchObject({
      vaardigheden: ["plannen", "kwalitatief-product-maken"],
      beroepstaken: ["software-realiseren"],
      niveau: 3,
    });
  });

  test("formatting inside a span stays inside it", () => {
    const [span] = spans("[a **bold** and `code` part]{.reflecteren niveau=1}");
    expect(toString(span)).toBe("a bold and code part");
    expect(span!.children.map((c) => c.type)).toEqual(["text", "strong", "text", "inlineCode", "text"]);
  });

  test("a reference inside a span", () => {
    const md = "[Shown in @[ADR 001 Tokenlaag] to the client]{.boodschap-delen niveau=2}";
    expect(spans(md)).toHaveLength(1);
    expect(entryRefs(md)).toEqual(["ADR 001 Tokenlaag"]);
  });

  test("two spans in one paragraph", () => {
    const found = spans("[one]{.plannen niveau=1} middle [two]{.samenwerken niveau=2}");
    expect(found.map((s) => toString(s))).toEqual(["one", "two"]);
  });

  test("spans in list items", () => {
    expect(spans("- [item]{.plannen niveau=2}")).toHaveLength(1);
  });

  test("unknown classes are kept for validation", () => {
    const [span] = spans("[x]{.samenwerkn niveau=2}");
    expect(span).toMatchObject({ vaardigheden: [], unknownClasses: ["samenwerkn"] });
  });

  test("things that are not spans", () => {
    expect(spans("[a link](https://example.com){.plannen}")).toHaveLength(0);
    expect(spans("plain [brackets] and array[0]")).toHaveLength(0);
    expect(spans("`[x]{.plannen niveau=2}`")).toHaveLength(0);
    expect(spans("[x]{niveau=2}")).toHaveLength(0);
    expect(spans("- [ ] todo\n- [x] done")).toHaveLength(0);
  });
});

describe("references", () => {
  test("all entry reference forms", () => {
    expect(entryRefs("See @2026-09-17, @[ADR 001 Tokenlaag] and @adr-001.")).toEqual([
      "2026-09-17",
      "ADR 001 Tokenlaag",
      "adr-001",
    ]);
  });

  test("file references", () => {
    const md = "Deck in @{2026-09-12-sprintreview.pptx}.";
    expect(fileRefs(md)).toEqual(["2026-09-12-sprintreview.pptx"]);
    expect(entryRefs(md)).toEqual([]);
  });

  test("ignored inside code and in email addresses", () => {
    expect(entryRefs("`@2026-09-17` and mail g@example.com")).toEqual([]);
    expect(fileRefs("```\n@{file.pdf}\n```")).toEqual([]);
  });
});
