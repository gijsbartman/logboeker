import { NIVEAUS, VAARDIGHEDEN, type Doel, type Entry, type Mijlpaal } from "@logboeker/core";
import { z } from "zod";

export const searchSchema = z.object({
  vaardigheid: z.array(z.enum(VAARDIGHEDEN)).default([]).catch([]),
  doel: z.array(z.string()).default([]).catch([]),
  niveau: z.array(z.number().int()).default([]).catch([]),
  soort: z.array(z.enum(["log", "bewijs"])).default([]).catch([]),
  groep: z.enum(["datum", "doel"]).default("datum").catch("datum"),
  open: z.array(z.string()).default([]).catch([]),
});

export type Search = z.infer<typeof searchSchema>;
export type FilterKey = "vaardigheid" | "doel" | "niveau" | "soort";

export const DEFAULT_SEARCH = searchSchema.parse({});

export function levelsOf(entry: Entry): number[] {
  return [...new Set(entry.spans.flatMap((s) => (s.niveau === null ? [] : [s.niveau])))].filter((n) =>
    (NIVEAUS as readonly number[]).includes(n),
  );
}

const overlaps = <T,>(selected: readonly T[], values: readonly T[]) =>
  selected.length === 0 || values.some((v) => selected.includes(v));

export function matchesFilters(entry: Entry, search: Search): boolean {
  return (
    overlaps(search.soort, [entry.kind]) &&
    overlaps(search.vaardigheid, entry.vaardigheden) &&
    overlaps(search.doel, entry.doelen) &&
    overlaps(search.niveau, levelsOf(entry))
  );
}

export function matchesMijlpaal(mijlpaal: Mijlpaal, search: Search): boolean {
  return (
    overlaps(search.vaardigheid, mijlpaal.vaardigheden) &&
    overlaps(search.doel, mijlpaal.doel ? [mijlpaal.doel] : []) &&
    overlaps(search.niveau, mijlpaal.niveau === null ? [] : [mijlpaal.niveau])
  );
}

export function matchesDoel(doel: Doel, search: Search): boolean {
  return overlaps(search.doel, [doel.slug]);
}

export function isFiltering(search: Search): boolean {
  return [search.vaardigheid, search.doel, search.niveau, search.soort].some((list) => list.length > 0);
}
