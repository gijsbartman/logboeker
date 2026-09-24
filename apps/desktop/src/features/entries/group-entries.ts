import type { Entry } from "@logboeker/core";

export type EntryGroup = { key: string; label: string | null; entries: Entry[] };

export function groupByDate(entries: Entry[]): EntryGroup[] {
  const groups = new Map<string, Entry[]>();
  for (const entry of entries) {
    const key = entry.date ?? "";
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  return [...groups].map(([key, list]) => ({ key, label: key || null, entries: list }));
}

// With a goal filter active, only those goals become groups; otherwise every
// goal that occurs does, plus a group for entries without a goal.
export function groupByDoel(entries: Entry[], doelen: string[], selected: string[]): EntryGroup[] {
  const order = selected.length > 0 ? doelen.filter((d) => selected.includes(d)) : doelen;
  const groups: EntryGroup[] = order
    .map((doel) => ({ key: doel, label: doel, entries: entries.filter((e) => e.doelen.includes(doel)) }))
    .filter((group) => group.entries.length > 0);

  const without = entries.filter((e) => e.doelen.length === 0);
  if (selected.length === 0 && without.length > 0) groups.push({ key: "", label: null, entries: without });
  return groups;
}
