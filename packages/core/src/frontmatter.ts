import { parseDocument, type ToStringOptions } from "yaml";

export interface SplitSource {
  yaml: string | null;
  body: string;
  yamlStart: number;
  yamlEnd: number;
  bodyStart: number;
}

const OPEN = /^---\r?\n/;
const CLOSE = /(^|\r?\n)---[ \t]*(\r?\n|$)/;

export function splitFrontmatter(source: string): SplitSource {
  const open = OPEN.exec(source);
  const close = open && CLOSE.exec(source.slice(open[0].length));
  if (!open || !close) {
    return { yaml: null, body: source, yamlStart: 0, yamlEnd: 0, bodyStart: 0 };
  }

  const yamlStart = open[0].length;
  const yamlEnd = yamlStart + close.index + close[1]!.length;
  const afterFence = yamlStart + close.index + close[0].length;
  const bodyStart = afterFence + /^(\r?\n)*/.exec(source.slice(afterFence))![0].length;
  return {
    yaml: source.slice(yamlStart, yamlEnd),
    body: source.slice(bodyStart),
    yamlStart,
    yamlEnd,
    bodyStart,
  };
}

export function replaceBody(source: string, body: string): string {
  const split = splitFrontmatter(source);
  return source.slice(0, split.bodyStart) + body;
}

export type FrontmatterRead =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; data: Record<string, unknown>; error: string };

export function readFrontmatter(yaml: string | null): FrontmatterRead {
  if (yaml === null || yaml.trim() === "") return { ok: true, data: {} };
  const doc = parseDocument(yaml);
  if (doc.errors.length > 0) {
    return { ok: false, data: {}, error: doc.errors[0]!.message };
  }
  const data = doc.toJS();
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, data: {}, error: "Frontmatter is not a mapping" };
  }
  return { ok: true, data: data as Record<string, unknown> };
}

const STRINGIFY: ToStringOptions = {
  flowCollectionPadding: false,
  lineWidth: 0,
};

// Edits the YAML document rather than a plain object, so key order, comments
// and unknown fields survive. Everything outside the frontmatter is untouched.
export function updateFrontmatter(
  source: string,
  patch: Record<string, unknown>,
): string {
  const split = splitFrontmatter(source);
  const doc = parseDocument(split.yaml ?? "");
  if (doc.errors.length > 0) {
    throw new Error(`Invalid frontmatter: ${doc.errors[0]!.message}`);
  }

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) {
      doc.delete(key);
    } else {
      doc.set(key, doc.createNode(value, { flow: true }));
    }
  }

  const yaml = doc.contents === null ? "" : doc.toString(STRINGIFY);
  if (split.yaml === null) {
    return `---\n${yaml}---\n\n${source}`;
  }
  return source.slice(0, split.yamlStart) + yaml + source.slice(split.yamlEnd);
}
