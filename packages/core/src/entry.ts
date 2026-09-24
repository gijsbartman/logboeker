import type { Heading, Root } from "mdast";
import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";
import { sprintWeek } from "./calendar";
import { readFrontmatter, splitFrontmatter } from "./frontmatter";
import { parseMarkdown, type EntryRef, type EvidenceSpan, type FileRef } from "./markdown";
import { frontmatterSchema, type Config, type Frontmatter } from "./schema";
import { isVaardigheid, type Vaardigheid } from "./vaardigheden";

export type EntryKind = "log" | "bewijs";

export const ENTRY_DIRS: Record<EntryKind, string> = {
  log: "logboek/daily",
  bewijs: "logboek/evidence",
};

export interface SpanSummary {
  text: string;
  vaardigheden: Vaardigheid[];
  beroepstaken: string[];
  unknownClasses: string[];
  niveau: number | null;
  inCheckIn: boolean;
}

export interface FrontmatterIssue {
  field: string;
  message: string;
}

export interface Entry {
  id: string;
  kind: EntryKind;
  path: string;
  date: string | null;
  sprint: number | null;
  week: number | null;
  title: string;
  portflowNaam: string | null;
  retroactief: boolean;
  vaardigheden: Vaardigheid[];
  beroepstaken: string[];
  doelen: string[];
  jira: string[];
  attachments: string[];
  refs: string[];
  spans: SpanSummary[];
  frontmatter: Frontmatter;
  frontmatterIssues: FrontmatterIssue[];
  body: string;
  text: string;
}

const CHECK_IN_HEADING = /^wat ga ik doen vandaag\??$/i;
const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}/;

export function kindOf(path: string): EntryKind | null {
  const dir = path.slice(0, path.lastIndexOf("/"));
  const match = Object.entries(ENTRY_DIRS).find(([, d]) => d === dir);
  return match ? (match[0] as EntryKind) : null;
}

function stemOf(path: string) {
  return path.slice(path.lastIndexOf("/") + 1).replace(/\.md$/, "");
}

function unique<T>(items: Iterable<T>): T[] {
  return [...new Set(items)];
}

// Invalid fields are dropped and reported, so one typo doesn't discard the
// rest of the frontmatter.
function parseFrontmatterFields(data: Record<string, unknown>) {
  const issues: FrontmatterIssue[] = [];
  let result = frontmatterSchema.safeParse(data);
  if (!result.success) {
    const invalid = new Set(result.error.issues.map((i) => String(i.path[0] ?? "")));
    for (const issue of result.error.issues) {
      issues.push({ field: String(issue.path[0] ?? ""), message: issue.message });
    }
    const kept = Object.fromEntries(Object.entries(data).filter(([k]) => !invalid.has(k)));
    result = frontmatterSchema.safeParse(kept);
  }
  return { frontmatter: result.success ? result.data : frontmatterSchema.parse({}), issues };
}

function summariseSpans(tree: Root): SpanSummary[] {
  const spans: SpanSummary[] = [];
  let checkInDepth: number | null = null;

  for (const block of tree.children) {
    if (block.type === "heading") {
      const heading = block as Heading;
      if (checkInDepth !== null && heading.depth <= checkInDepth) checkInDepth = null;
      if (CHECK_IN_HEADING.test(toString(heading).trim())) checkInDepth = heading.depth;
    }
    visit(block, "evidenceSpan", (span: EvidenceSpan) => {
      spans.push({
        text: toString(span),
        vaardigheden: span.vaardigheden,
        beroepstaken: span.beroepstaken,
        unknownClasses: span.unknownClasses,
        niveau: span.niveau,
        inCheckIn: checkInDepth !== null,
      });
    });
  }
  return spans;
}

function titleOf(tree: Root): string | null {
  const heading = tree.children.find((n): n is Heading => n.type === "heading" && n.depth === 1);
  return heading ? toString(heading).trim() : null;
}

export interface ParsedEntry {
  entry: Entry;
  tree: Root;
}

export function parseEntry(path: string, source: string, config: Config): ParsedEntry {
  const kind = kindOf(path);
  if (!kind) throw new Error(`Not an entry path: ${path}`);

  const split = splitFrontmatter(source);
  const read = readFrontmatter(split.yaml);
  const { frontmatter, issues } = parseFrontmatterFields(read.data);
  if (!read.ok) issues.unshift({ field: "", message: read.error });

  const tree = parseMarkdown(split.body);
  const spans = summariseSpans(tree);
  const refs: string[] = [];
  const fileRefs: string[] = [];
  visit(tree, "entryRef", (node: EntryRef) => void refs.push(node.key));
  visit(tree, "fileRef", (node: FileRef) => void fileRefs.push(node.name));

  const stem = stemOf(path);
  const date = frontmatter.date ?? DATE_PREFIX.exec(stem)?.[0] ?? null;
  const calendar = date ? sprintWeek(date, config) : null;

  const entry: Entry = {
    id: `${ENTRY_DIRS[kind]}/${stem}`,
    kind,
    path,
    date,
    sprint: calendar?.sprint ?? null,
    week: calendar?.week ?? null,
    title: frontmatter.titel ?? titleOf(tree) ?? stem,
    portflowNaam: frontmatter.portflow_naam ?? null,
    retroactief: frontmatter.retroactief,
    vaardigheden: unique([
      ...frontmatter.vaardigheden.filter(isVaardigheid),
      ...spans.flatMap((s) => s.vaardigheden),
    ]),
    beroepstaken: unique([...frontmatter.beroepstaken, ...spans.flatMap((s) => s.beroepstaken)]),
    doelen: frontmatter.doelen,
    jira: frontmatter.jira,
    attachments: unique([...frontmatter.bestanden, ...fileRefs].map((name) => name.split("/").pop()!)),
    refs: unique(refs),
    spans,
    frontmatter,
    frontmatterIssues: issues,
    body: split.body,
    text: tree.children.map((block) => toString(block)).join("\n"),
  };
  return { entry, tree };
}
