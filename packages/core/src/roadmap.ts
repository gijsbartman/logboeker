import { visit } from "unist-util-visit";
import { isMap, isSeq, type Document } from "yaml";
import { z } from "zod";
import { weekRange } from "./calendar";
import type { Entry } from "./entry";
import { editFrontmatter, readFrontmatter, splitFrontmatter } from "./frontmatter";
import { parseMarkdown, type EntryRef } from "./markdown";
import type { Resolver } from "./resolve";
import { isoDate, list, type Config } from "./schema";
import { isVaardigheid, type Vaardigheid } from "./vaardigheden";

const WEEK = /^week\s+(\d+)$/i;

const planDate = z.union([isoDate, z.string().trim().regex(WEEK, "Verwacht YYYY-MM-DD of week N")]);

const itemSchema = z.object({
  titel: z.string().trim().min(1),
  datum: planDate,
  tot: planDate.nullish(),
  doel: z.string().trim().nullish(),
  vaardigheden: list,
  bewijs: list,
  afgerond: isoDate.nullish(),
});

export type RoadmapIssueCode = "invalid-roadmap" | "unknown-vaardigheid";

export interface RoadmapIssue {
  code: RoadmapIssueCode;
  message: string;
}

export interface RoadmapItem {
  index: number;
  titel: string;
  start: string;
  eind: string;
  meerdaags: boolean;
  doel: string | null;
  vaardigheden: Vaardigheid[];
  bewijs: string[];
  afgerond: string | null;
}

export interface Roadmap {
  items: RoadmapItem[];
  refs: string[];
  issues: RoadmapIssue[];
}

export const EMPTY_ROADMAP: Roadmap = { items: [], refs: [], issues: [] };

const LIST = "planning";

function resolveDate(value: string, edge: "start" | "end", config: Config): string | null {
  const week = WEEK.exec(value);
  if (!week) return value;
  return weekRange(Number(week[1]), config)?.[edge] ?? null;
}

function describe(error: z.ZodError, label: string): string {
  const issue = error.issues[0]!;
  return `${label}${issue.path.length ? `.${issue.path.join(".")}` : ""}: ${issue.message}`;
}

// A single `datum: week 3` is a deadline, so it lands on Friday; as the
// start of a range it is the Monday.
export function parseRoadmap(source: string, config: Config): Roadmap {
  const split = splitFrontmatter(source);
  const read = readFrontmatter(split.yaml);
  const issues: RoadmapIssue[] = read.ok ? [] : [{ code: "invalid-roadmap", message: read.error }];

  const raw = read.data[LIST] ?? [];
  if (!Array.isArray(raw)) issues.push({ code: "invalid-roadmap", message: `${LIST}: verwacht een lijst` });

  const items: RoadmapItem[] = [];
  (Array.isArray(raw) ? raw : []).forEach((value, index) => {
    const parsed = itemSchema.safeParse(value);
    if (!parsed.success) {
      issues.push({ code: "invalid-roadmap", message: describe(parsed.error, `${LIST}[${index}]`) });
      return;
    }
    const { titel, tot, doel, vaardigheden, bewijs, afgerond } = parsed.data;
    const start = resolveDate(parsed.data.datum, tot ? "start" : "end", config);
    const eind = tot ? resolveDate(tot, "end", config) : start;
    if (!start || !eind) {
      issues.push({ code: "invalid-roadmap", message: `"${titel}": week zonder semesterstart` });
      return;
    }
    if (eind < start) {
      issues.push({ code: "invalid-roadmap", message: `"${titel}": tot ligt voor de datum` });
      return;
    }
    for (const slug of vaardigheden.filter((s) => !isVaardigheid(s))) {
      issues.push({ code: "unknown-vaardigheid", message: `Onbekende vaardigheid "${slug}" bij "${titel}"` });
    }
    items.push({
      index,
      titel,
      start,
      eind,
      meerdaags: !!tot,
      doel: doel || null,
      vaardigheden: vaardigheden.filter(isVaardigheid),
      bewijs,
      afgerond: afgerond ?? null,
    });
  });

  const refs: string[] = [];
  visit(parseMarkdown(split.body), "entryRef", (node: EntryRef) => void refs.push(node.key));

  return { items, refs: [...new Set(refs)], issues };
}

export const ROADMAP_TEMPLATE = `---
planning:
---

# Roadmap

Semesterplanning. De app toont dit bestand als kalender.

Elk item heeft een \`titel\` en een \`datum\`, als \`YYYY-MM-DD\` of weeknummer (\`week 3\`).
Met \`tot\` erbij loopt het over meerdere dagen. Optioneel: \`doel\` (de slug uit \`doelen:\` van
je entries), \`vaardigheden\` en \`bewijs\` (namen zoals bij @[...]). Zet \`afgerond\` op de datum
waarop het klaar is.
`;

export type RoadmapEdit =
  | { action: "add"; fields: Record<string, unknown> }
  | { action: "update"; index: number; fields: Record<string, unknown> }
  | { action: "remove"; index: number };

const isEmpty = (value: unknown) =>
  value == null || value === "" || (Array.isArray(value) && value.length === 0);

const valueNode = (doc: Document, value: unknown) =>
  doc.createNode(value, { flow: Array.isArray(value) });

function applyEdit(doc: Document, edit: RoadmapEdit) {
  let seq = doc.get(LIST);
  if (!isSeq(seq)) {
    if (edit.action !== "add") throw new Error(`${LIST} is geen lijst`);
    seq = doc.createNode([]);
    doc.set(LIST, seq);
  }
  if (!isSeq(seq)) return;

  if (edit.action === "add") {
    const fields = Object.entries(edit.fields).filter(([, v]) => !isEmpty(v));
    seq.add(doc.createNode(Object.fromEntries(fields), { flow: false }));
    const item = seq.items[seq.items.length - 1];
    if (isMap(item)) for (const [key, value] of fields) item.set(key, valueNode(doc, value));
    return;
  }

  const item = seq.items[edit.index];
  if (!isMap(item)) throw new Error(`${LIST}[${edit.index}] bestaat niet`);
  if (edit.action === "remove") {
    seq.items.splice(edit.index, 1);
    return;
  }
  for (const [key, value] of Object.entries(edit.fields)) {
    if (isEmpty(value)) item.delete(key);
    else item.set(key, valueNode(doc, value));
  }
}

// Applied in order; removals shift later indexes, so callers remove last.
export function editRoadmap(source: string | null, edits: RoadmapEdit[]): string {
  return editFrontmatter(source ?? ROADMAP_TEMPLATE, (doc) => {
    for (const edit of edits) applyEdit(doc, edit);
  });
}

export type ItemStatus = "gepland" | "bezig" | "afgerond" | "verlopen";

export interface Bewijsstuk {
  key: string;
  entry: Entry | null;
}

export interface ItemVoortgang {
  item: RoadmapItem;
  status: ItemStatus;
  bewijsstukken: Bewijsstuk[];
  bewijsAanwezig: boolean;
  entries: Entry[];
}

export interface RoadmapVoortgang {
  items: ItemVoortgang[];
  ongepland: string[];
}

function itemStatus(item: RoadmapItem, today: string): ItemStatus {
  if (item.afgerond) return "afgerond";
  if (today > item.eind) return "verlopen";
  if (item.meerdaags && today >= item.start) return "bezig";
  return "gepland";
}

export function roadmapStatus(roadmap: Roadmap, entries: Entry[], resolver: Resolver, today: string): RoadmapVoortgang {
  const items = roadmap.items.map((item) => {
    const bewijsstukken = item.bewijs.map((key) => ({ key, entry: resolver.resolve(key) }));
    return {
      item,
      status: itemStatus(item, today),
      bewijsstukken,
      bewijsAanwezig: !item.afgerond && bewijsstukken.length > 0 && bewijsstukken.every((b) => b.entry),
      entries: item.doel ? entries.filter((e) => e.doelen.includes(item.doel!)) : [],
    };
  });

  const gepland = new Set(roadmap.items.flatMap((i) => (i.doel ? [i.doel] : [])));
  const ongepland = [...new Set(entries.flatMap((e) => e.doelen))].filter((slug) => !gepland.has(slug));
  return { items, ongepland };
}
