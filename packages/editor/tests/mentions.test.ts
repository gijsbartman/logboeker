import { CompletionContext } from "@codemirror/autocomplete";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { expect, test } from "vitest";
import { mentionSource, spanAttrSource, type MentionItem } from "../src/mentions";

const items: MentionItem[] = [
  { kind: "log", label: "2026-09-18 Sprintreview", insert: "@2026-09-18" },
  { kind: "bewijs", label: "ADR 001 Tokenlaag", insert: "@[ADR 001 Tokenlaag]" },
  { kind: "file", label: "deck.pptx", insert: "@{deck.pptx}" },
];

function complete(doc: string, source = mentionSource(() => items)) {
  const state = EditorState.create({ doc });
  return source(new CompletionContext(state, doc.length, false));
}

function accept(doc: string, index: number) {
  const view = new EditorView({ state: EditorState.create({ doc, selection: { anchor: doc.length } }) });
  const result = complete(doc)!;
  const option = result.options[index]!;
  (option.apply as (v: EditorView, c: typeof option, f: number, t: number) => void)(view, option, result.from, doc.length);
  return view.state.doc.toString();
}

test("@ offers logs, evidence and attachments in their own sections", () => {
  const result = complete("Zie @")!;
  expect(result.options.map((o) => [o.label, (o.section as { name: string }).name])).toEqual([
    ["2026-09-18 Sprintreview", "Logs"],
    ["ADR 001 Tokenlaag", "Bewijs"],
    ["deck.pptx", "Bijlagen"],
  ]);
});

test("the query starts after @, @[ or @{ so it matches labels", () => {
  expect(complete("Zie @spr")!.from).toBe(5);
  expect(complete("Zie @[ADR")!.from).toBe(6);
  expect(complete("Zie @{dec")!.from).toBe(6);
});

test("accepting replaces everything typed with the canonical syntax", () => {
  expect(accept("Zie @[ADR", 1)).toBe("Zie @[ADR 001 Tokenlaag]");
  expect(accept("Zie @spr", 0)).toBe("Zie @2026-09-18");
  expect(accept("Deck @{d", 2)).toBe("Deck @{deck.pptx}");
});

test("no suggestions inside an email address", () => {
  expect(complete("mail g@exa")).toBeNull();
});

test("inside span attributes it offers skills and levels", () => {
  const result = complete("[tekst]{.samen", spanAttrSource)!;
  expect(result.from).toBe(8);
  expect(result.options.map((o) => o.label)).toContain(".samenwerken");
  expect(result.options.map((o) => o.label)).toContain("niveau=3");
  expect(complete("gewoon {tekst", spanAttrSource)).toBeNull();
});
