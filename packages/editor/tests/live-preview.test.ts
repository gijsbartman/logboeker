import { markdown } from "@codemirror/lang-markdown";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { expect, test } from "vitest";
import { livePreview } from "../src/live-preview";

function render(doc: string, cursor = doc.length, options = {}) {
  return new EditorView({
    state: EditorState.create({
      doc,
      selection: EditorSelection.cursor(cursor),
      extensions: [markdown(), livePreview(options)],
    }),
  });
}

const text = (view: EditorView) => view.contentDOM.textContent;

test("outside the cursor a span shows its text and a level badge, not its syntax", () => {
  const view = render("Hallo [samen gewerkt]{.samenwerken niveau=2}\n\nverder", 0);
  expect(text(view)).toContain("samen gewerktN2");
  expect(text(view)).not.toContain("{.samenwerken");
  const span = view.contentDOM.querySelector(".cm-evidence-span") as HTMLElement;
  expect(span.textContent).toBe("samen gewerkt");
  expect(span.getAttribute("style")).toContain("var(--skill-samenwerken)");
});

test("with the cursor inside, the raw syntax is editable", () => {
  const doc = "Hallo [samen gewerkt]{.samenwerken niveau=2}";
  const view = render(doc, doc.indexOf("gewerkt"));
  expect(text(view)).toContain("[samen gewerkt]{.samenwerken niveau=2}");
});

test("references are marked, unresolved ones differently", () => {
  const view = render("Zie @2026-09-17 en @onbekend", 0, { resolveRef: (key: string) => key === "2026-09-17" });
  const refs = [...view.contentDOM.querySelectorAll(".cm-ref")].map((el) => [el.textContent, el.classList.contains("cm-ref-missing")]);
  expect(refs).toEqual([
    ["@2026-09-17", false],
    ["@onbekend", true],
  ]);
});

test("heading markers hide when the cursor is on another line", () => {
  const view = render("# Titel\n\ntekst", 10);
  expect(text(view)).toContain("Titel");
  expect(text(view)).not.toContain("# Titel");
  expect(view.contentDOM.querySelector(".cm-h1")).not.toBeNull();
});
