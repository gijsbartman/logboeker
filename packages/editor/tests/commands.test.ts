import { EditorState } from "@codemirror/state";
import { expect, test } from "vitest";
import { inCheckIn, labelRange, relabelSpan, spanAt, unlabelSpan } from "../src/commands";

const apply = (state: EditorState, spec: Parameters<EditorState["update"]>[0]) => state.update(spec).state;

test("labelling a selection wraps it and keeps it selected", () => {
  const state = EditorState.create({ doc: "Ik heb samengewerkt vandaag." });
  const next = apply(state, labelRange(7, 19, { vaardigheden: ["samenwerken"], beroepstaken: [], niveau: 2 }));
  expect(next.doc.toString()).toBe("Ik heb [samengewerkt]{.samenwerken niveau=2} vandaag.");
  expect(next.sliceDoc(next.selection.main.from, next.selection.main.to)).toBe("samengewerkt");
});

test("finding, relabelling and removing a span", () => {
  const state = EditorState.create({ doc: "A [b]{.plannen niveau=1} c" });
  const span = spanAt(state, 3)!;
  expect(span.attrs.vaardigheden).toEqual(["plannen"]);
  expect(spanAt(state, 0)).toBeNull();

  const relabelled = apply(state, relabelSpan(span, { vaardigheden: ["plannen", "reflecteren"], beroepstaken: [], niveau: 3 }));
  expect(relabelled.doc.toString()).toBe("A [b]{.plannen .reflecteren niveau=3} c");
  expect(apply(state, unlabelSpan(span)).doc.toString()).toBe("A b c");
});

test("unknown classes survive a relabel only when passed along", () => {
  const state = EditorState.create({ doc: "[x]{.samenwerkn niveau=2}" });
  const span = spanAt(state, 1)!;
  expect(apply(state, relabelSpan(span, { ...span.attrs, niveau: 3 })).doc.toString()).toBe("[x]{.samenwerkn niveau=3}");
});

test("the check-in section is recognised", () => {
  const doc = "## Wat ga ik doen vandaag?\n\n- plan\n\n## Wat heb ik gedaan vandaag?\n\nwerk\n";
  const state = EditorState.create({ doc });
  expect(inCheckIn(state, doc.indexOf("plan"))).toBe(true);
  expect(inCheckIn(state, doc.indexOf("werk"))).toBe(false);
});
