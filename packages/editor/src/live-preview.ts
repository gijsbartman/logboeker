import { scanSource } from "@logboeker/core";
import { syntaxTree } from "@codemirror/language";
import { Facet, type EditorState, type Range } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";

export type PreviewOptions = {
  resolveRef?: (key: string) => boolean;
  hasFile?: (name: string) => boolean;
};

export const previewOptions = Facet.define<PreviewOptions, PreviewOptions>({
  combine: (values) => values[0] ?? {},
});

class LevelBadge extends WidgetType {
  constructor(readonly niveau: number | null) {
    super();
  }

  eq(other: LevelBadge) {
    return other.niveau === this.niveau;
  }

  toDOM() {
    const badge = document.createElement("span");
    badge.className = "cm-span-level";
    badge.textContent = this.niveau === null ? "N?" : `N${this.niveau}`;
    return badge;
  }
}

const hide = Decoration.replace({});
const syntax = Decoration.mark({ class: "cm-span-syntax" });

function touchesSelection(state: EditorState, from: number, to: number) {
  return state.selection.ranges.some((range) => range.from <= to && range.to >= from);
}

function touchesLine(state: EditorState, pos: number) {
  const line = state.doc.lineAt(pos);
  return touchesSelection(state, line.from, line.to);
}

function evidenceDecorations(state: EditorState, out: Range<Decoration>[]) {
  const options = state.facet(previewOptions);
  const { spans, refs } = scanSource(state.doc.toString());

  for (const span of spans) {
    const skill = span.attrs.vaardigheden[0];
    const style = `--skill: ${skill ? `var(--skill-${skill})` : "var(--muted-foreground, currentColor)"}`;
    if (span.textTo > span.textFrom) {
      out.push(Decoration.mark({ class: "cm-evidence-span", attributes: { style } }).range(span.textFrom, span.textTo));
    }
    if (touchesSelection(state, span.from, span.to)) {
      out.push(syntax.range(span.from, span.textFrom), syntax.range(span.textTo, span.to));
    } else {
      out.push(hide.range(span.from, span.textFrom));
      out.push(Decoration.replace({ widget: new LevelBadge(span.attrs.niveau) }).range(span.textTo, span.to));
    }
  }

  for (const ref of refs) {
    const resolved = ref.kind === "file" ? (options.hasFile?.(ref.key) ?? true) : (options.resolveRef?.(ref.key) ?? true);
    out.push(Decoration.mark({ class: resolved ? "cm-ref" : "cm-ref cm-ref-missing" }).range(ref.from, ref.to));
  }
}

const MARKS = new Set(["EmphasisMark", "HeaderMark"]);

function markdownDecorations(view: EditorView, out: Range<Decoration>[]) {
  const { state } = view;
  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from,
      to,
      enter: (node) => {
        const heading = /^ATXHeading(\d)$/.exec(node.name);
        if (heading) {
          out.push(Decoration.line({ class: `cm-heading cm-h${heading[1]}` }).range(state.doc.lineAt(node.from).from));
        }
        if (!MARKS.has(node.name) || touchesLine(state, node.from)) return;
        const end = node.name === "HeaderMark" && state.sliceDoc(node.to, node.to + 1) === " " ? node.to + 1 : node.to;
        out.push(hide.range(node.from, end));
      },
    });
  }
}

function build(view: EditorView): DecorationSet {
  const out: Range<Decoration>[] = [];
  evidenceDecorations(view.state, out);
  markdownDecorations(view, out);
  return Decoration.set(out, true);
}

const plugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = build(view);
    }

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.selectionSet ||
        update.viewportChanged ||
        syntaxTree(update.startState) !== syntaxTree(update.state)
      ) {
        this.decorations = build(update.view);
      }
    }
  },
  { decorations: (value) => value.decorations },
);

const theme = EditorView.baseTheme({
  ".cm-evidence-span": {
    backgroundColor: "color-mix(in oklch, var(--skill) 14%, transparent)",
    textDecoration: "underline 2px var(--skill)",
    textUnderlineOffset: "4px",
    borderRadius: "2px",
  },
  ".cm-span-syntax": { opacity: "0.55", fontSize: "0.9em" },
  ".cm-span-level": {
    marginLeft: "3px",
    padding: "0 4px",
    borderRadius: "4px",
    fontSize: "0.75em",
    fontWeight: "500",
    backgroundColor: "color-mix(in oklch, currentColor 10%, transparent)",
    verticalAlign: "1px",
  },
  ".cm-ref": { color: "var(--primary, inherit)", textDecoration: "underline dotted", textUnderlineOffset: "3px" },
  ".cm-ref-missing": { textDecoration: "line-through", opacity: "0.6" },
  ".cm-heading": { fontWeight: "600" },
  ".cm-h1": { fontSize: "1.4em" },
  ".cm-h2": { fontSize: "1.2em" },
  ".cm-h3": { fontSize: "1.05em" },
});

export function livePreview(options: PreviewOptions = {}) {
  return [previewOptions.of(options), plugin, theme];
}
