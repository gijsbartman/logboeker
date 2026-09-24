import { CHECK_IN_HEADING } from "../entry";
import type { EvidenceSpan } from "./nodes";
import { ENTRY_REF, FILE_REF } from "./refs";
import { parseSpanAttrs } from "./spans";

export interface SourceSpan {
  from: number;
  to: number;
  textFrom: number;
  textTo: number;
  attrs: Omit<EvidenceSpan, "children" | "data">;
}

export interface SourceRef {
  from: number;
  to: number;
  kind: "entry" | "file";
  key: string;
}

const CODE = /^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$|`[^`\n]*`/gm;
const ATTRS = /^\{([^{}\n]+)\}/;

// Offsets stay valid because code is blanked out rather than removed.
function maskCode(text: string): string {
  return text.replace(CODE, (code) => code.replace(/[^\n]/g, " "));
}

function scanSpans(text: string): SourceSpan[] {
  const spans: SourceSpan[] = [];
  const open: Array<{ at: number; ref: boolean }> = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "\n" && text[i + 1] === "\n") open.length = 0;
    if (char === "[") {
      open.push({ at: i, ref: text[i - 1] === "@" });
      continue;
    }
    if (char !== "]") continue;

    const start = open.pop();
    if (!start || start.ref) continue;
    const attrs = ATTRS.exec(text.slice(i + 1));
    const parsed = attrs && parseSpanAttrs(attrs[1]!);
    if (!attrs || !parsed) continue;

    const { type, vaardigheden, beroepstaken, unknownClasses, niveau } = parsed;
    const to = i + 1 + attrs[0].length;
    spans.push({
      from: start.at,
      to,
      textFrom: start.at + 1,
      textTo: i,
      attrs: { type, vaardigheden, beroepstaken, unknownClasses, niveau },
    });
    open.length = 0;
    i = to - 1;
  }
  return spans;
}

function scanRefs(text: string): SourceRef[] {
  const refs: SourceRef[] = [];
  for (const match of text.matchAll(FILE_REF)) {
    refs.push({ from: match.index, to: match.index + match[0].length, kind: "file", key: match[1]!.trim() });
  }
  const withoutFiles = text.replace(FILE_REF, (m) => " ".repeat(m.length));
  for (const match of withoutFiles.matchAll(ENTRY_REF)) {
    const key = (match[1] ?? match[2] ?? match[3] ?? "").trim();
    refs.push({ from: match.index, to: match.index + match[0].length, kind: "entry", key });
  }
  return refs.sort((a, b) => a.from - b.from);
}

export function scanSource(text: string): { spans: SourceSpan[]; refs: SourceRef[] } {
  const masked = maskCode(text);
  return { spans: scanSpans(masked), refs: scanRefs(masked) };
}

const HEADING = /^(#{1,6})[ \t]+(.+?)[ \t#]*$/gm;

export function checkInRange(text: string): { from: number; to: number } | null {
  let start: { from: number; depth: number } | null = null;
  for (const match of maskCode(text).matchAll(HEADING)) {
    const depth = match[1]!.length;
    if (!start) {
      if (CHECK_IN_HEADING.test(match[2]!.trim())) start = { from: match.index, depth };
    } else if (depth <= start.depth) {
      return { from: start.from, to: match.index };
    }
  }
  return start && { from: start.from, to: text.length };
}
