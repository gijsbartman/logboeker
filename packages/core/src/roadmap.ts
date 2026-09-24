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
const doneDate = isoDate.nullish().transform((value) => value ?? null);

const doelSchema = z.object({
  slug: z.string().trim().min(1),
  titel: z.string().nullish(),
  van: planDate,
  tot: planDate,
  afgerond: doneDate,
});

const mijlpaalSchema = z.object({
  titel: z.string().trim().min(1),
  datum: planDate,
  bewijs: list,
  vaardigheden: list,
  niveau: z.number().int().nullish(),
  doel: z.string().trim().nullish(),
  behaald: doneDate,
});

export type RoadmapIssueCode = "invalid-roadmap" | "unknown-vaardigheid" | "unknown-doel";

export interface RoadmapIssue {
  code: RoadmapIssueCode;
  message: string;
}

export interface Doel {
  index: number;
  slug: string;
  titel: string;
  van: string;
  tot: string;
  afgerond: string | null;
}

export interface Mijlpaal {
  index: number;
  titel: string;
  datum: string;
  bewijs: string[];
  vaardigheden: Vaardigheid[];
  niveau: number | null;
  doel: string | null;
  behaald: string | null;
}

export interface Roadmap {
  doelen: Doel[];
  mijlpalen: Mijlpaal[];
  refs: string[];
  issues: RoadmapIssue[];
}

export const EMPTY_ROADMAP: Roadmap = { doelen: [], mijlpalen: [], refs: [], issues: [] };

function resolveDate(value: string, edge: "start" | "end", config: Config): string | null {
  const week = WEEK.exec(value);
  if (!week) return value;
  return weekRange(Number(week[1]), config)?.[edge] ?? null;
}

function items(data: Record<string, unknown>, key: string, issues: RoadmapIssue[]): unknown[] {
  const value = data[key];
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  issues.push({ code: "invalid-roadmap", message: `${key}: verwacht een lijst` });
  return [];
}

function describe(error: z.ZodError, label: string): string {
  const issue = error.issues[0]!;
  return `${label}${issue.path.length ? `.${issue.path.join(".")}` : ""}: ${issue.message}`;
}

export function parseRoadmap(source: string, config: Config): Roadmap {
  const split = splitFrontmatter(source);
  const read = readFrontmatter(split.yaml);
  const issues: RoadmapIssue[] = read.ok ? [] : [{ code: "invalid-roadmap", message: read.error }];

  const doelen: Doel[] = [];
  items(read.data, "doelen", issues).forEach((raw, index) => {
    const parsed = doelSchema.safeParse(raw);
    if (!parsed.success) {
      issues.push({ code: "invalid-roadmap", message: describe(parsed.error, `doelen[${index}]`) });
      return;
    }
    const { slug, titel, afgerond } = parsed.data;
    const van = resolveDate(parsed.data.van, "start", config);
    const tot = resolveDate(parsed.data.tot, "end", config);
    if (!van || !tot) {
      issues.push({ code: "invalid-roadmap", message: `Doel "${slug}": week zonder semesterstart` });
      return;
    }
    doelen.push({ index, slug, titel: titel?.trim() || slug, van, tot, afgerond });
  });

  const slugs = new Set(doelen.map((d) => d.slug));
  const mijlpalen: Mijlpaal[] = [];
  items(read.data, "mijlpalen", issues).forEach((raw, index) => {
    const parsed = mijlpaalSchema.safeParse(raw);
    if (!parsed.success) {
      issues.push({ code: "invalid-roadmap", message: describe(parsed.error, `mijlpalen[${index}]`) });
      return;
    }
    const { titel, bewijs, niveau, doel, behaald } = parsed.data;
    const datum = resolveDate(parsed.data.datum, "end", config);
    if (!datum) {
      issues.push({ code: "invalid-roadmap", message: `Mijlpaal "${titel}": week zonder semesterstart` });
      return;
    }
    for (const slug of parsed.data.vaardigheden.filter((s) => !isVaardigheid(s))) {
      issues.push({ code: "unknown-vaardigheid", message: `Onbekende vaardigheid "${slug}" bij mijlpaal "${titel}"` });
    }
    if (doel && !slugs.has(doel)) {
      issues.push({ code: "unknown-doel", message: `Mijlpaal "${titel}" hoort bij onbekend doel "${doel}"` });
    }
    mijlpalen.push({
      index,
      titel,
      datum,
      bewijs,
      vaardigheden: parsed.data.vaardigheden.filter(isVaardigheid),
      niveau: niveau ?? null,
      doel: doel || null,
      behaald,
    });
  });

  const refs: string[] = [];
  visit(parseMarkdown(split.body), "entryRef", (node: EntryRef) => void refs.push(node.key));

  return { doelen, mijlpalen, refs: [...new Set(refs)], issues };
}

export const ROADMAP_TEMPLATE = `---
doelen:
mijlpalen:
---

# Roadmap

Semesterplanning. De app toont dit bestand als kalender.

Een doel heeft een \`slug\` (dezelfde als in \`doelen:\` van je entries), een \`titel\`, en
\`van\` en \`tot\` als datum (\`YYYY-MM-DD\`) of weeknummer (\`week 3\`). Zet \`afgerond\` op de
datum waarop het doel geëvalueerd is.

Een mijlpaal heeft een \`titel\` en een \`datum\`, en optioneel \`bewijs\` (namen zoals bij @[...]),
\`vaardigheden\`, \`niveau\` en \`doel\`. Zet \`behaald\` op de datum waarop je hem haalde.
`;

export type RoadmapList = "doelen" | "mijlpalen";

export type RoadmapEdit =
  | { list: RoadmapList; action: "add"; fields: Record<string, unknown> }
  | { list: RoadmapList; action: "update"; index: number; fields: Record<string, unknown> }
  | { list: RoadmapList; action: "remove"; index: number };

const isEmpty = (value: unknown) =>
  value == null || value === "" || (Array.isArray(value) && value.length === 0);

const valueNode = (doc: Document, value: unknown) =>
  doc.createNode(value, { flow: Array.isArray(value) });

function applyEdit(doc: Document, edit: RoadmapEdit) {
  let seq = doc.get(edit.list);
  if (!isSeq(seq)) {
    if (edit.action !== "add") throw new Error(`${edit.list} is geen lijst`);
    seq = doc.createNode([]);
    doc.set(edit.list, seq);
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
  if (!isMap(item)) throw new Error(`${edit.list}[${edit.index}] bestaat niet`);
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

export type MijlpaalStatus = "behaald" | "verlopen" | "open";
export type DoelStatus = "gepland" | "bezig" | "afgerond" | "over-tijd";

export interface Bewijsstuk {
  key: string;
  entry: Entry | null;
}

export interface MijlpaalVoortgang {
  mijlpaal: Mijlpaal;
  status: MijlpaalStatus;
  bewijsstukken: Bewijsstuk[];
  bewijsAanwezig: boolean;
}

export interface DoelVoortgang {
  doel: Doel;
  status: DoelStatus;
  entries: Entry[];
  actieveWeken: Set<number>;
}

export interface RoadmapVoortgang {
  doelen: DoelVoortgang[];
  mijlpalen: MijlpaalVoortgang[];
  ongepland: string[];
}

function doelStatus(doel: Doel, today: string): DoelStatus {
  if (doel.afgerond) return "afgerond";
  if (today < doel.van) return "gepland";
  if (today > doel.tot) return "over-tijd";
  return "bezig";
}

export function roadmapStatus(roadmap: Roadmap, entries: Entry[], resolver: Resolver, today: string): RoadmapVoortgang {
  const slugs = new Set(roadmap.doelen.map((d) => d.slug));

  const doelen = roadmap.doelen.map((doel) => {
    const linked = entries.filter((e) => e.doelen.includes(doel.slug));
    return {
      doel,
      status: doelStatus(doel, today),
      entries: linked,
      actieveWeken: new Set(linked.flatMap((e) => (e.week === null ? [] : [e.week]))),
    };
  });

  const mijlpalen = roadmap.mijlpalen.map((mijlpaal) => {
    const bewijsstukken = mijlpaal.bewijs.map((key) => ({ key, entry: resolver.resolve(key) }));
    const status: MijlpaalStatus = mijlpaal.behaald ? "behaald" : mijlpaal.datum < today ? "verlopen" : "open";
    return {
      mijlpaal,
      status,
      bewijsstukken,
      bewijsAanwezig: !mijlpaal.behaald && bewijsstukken.length > 0 && bewijsstukken.every((b) => b.entry),
    };
  });

  const ongepland = [...new Set(entries.flatMap((e) => e.doelen))].filter((slug) => !slugs.has(slug));
  return { doelen, mijlpalen, ongepland };
}
