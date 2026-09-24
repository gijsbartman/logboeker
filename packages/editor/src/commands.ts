import { checkInRange, formatSpanAttrs, scanSource, type SourceSpan } from "@logboeker/core";
import type { EditorState, TransactionSpec } from "@codemirror/state";

export type Labels = Parameters<typeof formatSpanAttrs>[0];

export function spanAt(state: EditorState, pos: number): SourceSpan | null {
  return scanSource(state.doc.toString()).spans.find((span) => span.from <= pos && pos <= span.to) ?? null;
}

export function inCheckIn(state: EditorState, from: number, to: number = from): boolean {
  const range = checkInRange(state.doc.toString());
  return range !== null && from < range.to && to > range.from;
}

export function labelRange(from: number, to: number, labels: Labels): TransactionSpec {
  const suffix = `]{${formatSpanAttrs(labels)}}`;
  return {
    changes: [
      { from, insert: "[" },
      { from: to, insert: suffix },
    ],
    selection: { anchor: from + 1, head: to + 1 },
  };
}

export function relabelSpan(span: SourceSpan, labels: Labels): TransactionSpec {
  return { changes: { from: span.textTo + 1, to: span.to, insert: `{${formatSpanAttrs(labels)}}` } };
}

export function unlabelSpan(span: SourceSpan): TransactionSpec {
  return {
    changes: [
      { from: span.from, to: span.textFrom },
      { from: span.textTo, to: span.to },
    ],
  };
}
