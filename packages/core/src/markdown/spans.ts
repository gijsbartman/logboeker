import type { Nodes, Parent, PhrasingContent, Text } from "mdast";
import { BEROEPSTAAK_PREFIX, isVaardigheid, type Vaardigheid } from "../vaardigheden";
import { H_NAMES, type EvidenceSpan } from "./nodes";

interface Cursor {
  child: number;
  offset: number;
}

interface Match {
  start: Cursor;
  end: Cursor;
  attrsEnd: number;
  span: Omit<EvidenceSpan, "children">;
}

const ATTRS = /^\{([^{}\n]+)\}/;
const SKIP = new Set(["code", "inlineCode", "link", "linkReference", "html"]);

export function parseSpanAttrs(raw: string): Omit<EvidenceSpan, "children"> | null {
  const vaardigheden: Vaardigheid[] = [];
  const beroepstaken: string[] = [];
  const unknownClasses: string[] = [];
  let niveau: number | null = null;

  for (const token of raw.trim().split(/\s+/)) {
    if (token.startsWith(".")) {
      const cls = token.slice(1);
      if (cls.startsWith(BEROEPSTAAK_PREFIX)) beroepstaken.push(cls.slice(BEROEPSTAAK_PREFIX.length));
      else if (isVaardigheid(cls)) vaardigheden.push(cls);
      else unknownClasses.push(cls);
    } else if (token.startsWith("niveau=")) {
      const value = Number(token.slice("niveau=".length));
      niveau = Number.isInteger(value) ? value : null;
    }
  }

  if (vaardigheden.length + beroepstaken.length + unknownClasses.length === 0) return null;
  return {
    type: "evidenceSpan",
    vaardigheden,
    beroepstaken,
    unknownClasses,
    niveau,
    data: {
      hName: H_NAMES.evidenceSpan,
      hProperties: {
        vaardigheden: vaardigheden.join(" "),
        beroepstaken: beroepstaken.join(" "),
        niveau,
      },
    },
  };
}

// `[text]{.attrs}` isn't markdown, so remark leaves the brackets as literal
// text, but formatting inside the span splits it over several sibling nodes.
// We match brackets across siblings and wrap everything between them.
function findMatches(children: PhrasingContent[]): Match[] {
  const matches: Match[] = [];
  const open: Array<Cursor & { ref: boolean }> = [];

  children.forEach((node, child) => {
    if (node.type !== "text") return;
    const value = node.value;
    for (let offset = 0; offset < value.length; offset++) {
      const char = value[offset];
      if (char === "[") {
        open.push({ child, offset, ref: value[offset - 1] === "@" });
        continue;
      }
      if (char !== "]") continue;

      const start = open.pop();
      if (!start || start.ref) continue;
      const attrs = ATTRS.exec(value.slice(offset + 1));
      const span = attrs && parseSpanAttrs(attrs[1]!);
      if (!attrs || !span) continue;

      const attrsEnd = offset + 1 + attrs[0].length;
      matches.push({ start, end: { child, offset }, attrsEnd, span });
      open.length = 0;
      offset = attrsEnd - 1;
    }
  });

  return matches;
}

function text(value: string): Text[] {
  return value ? [{ type: "text", value }] : [];
}

function wrap(children: PhrasingContent[], match: Match) {
  const first = children[match.start.child] as Text;
  const last = children[match.end.child] as Text;
  const inner =
    first === last
      ? text(first.value.slice(match.start.offset + 1, match.end.offset))
      : [
          ...text(first.value.slice(match.start.offset + 1)),
          ...children.slice(match.start.child + 1, match.end.child),
          ...text(last.value.slice(0, match.end.offset)),
        ];

  children.splice(
    match.start.child,
    match.end.child - match.start.child + 1,
    ...text(first.value.slice(0, match.start.offset)),
    { ...match.span, children: inner },
    ...text(last.value.slice(match.attrsEnd)),
  );
}

export function wrapEvidenceSpans(node: Nodes) {
  if (!("children" in node) || SKIP.has(node.type)) return;
  const parent = node as Parent;
  const children = parent.children as PhrasingContent[];

  for (const match of findMatches(children).reverse()) wrap(children, match);
  for (const child of parent.children) wrapEvidenceSpans(child as Nodes);
}
