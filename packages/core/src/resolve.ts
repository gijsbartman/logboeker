import type { Entry } from "./entry";

export interface UnresolvedRef {
  from: string;
  key: string;
}

export interface Resolver {
  resolve(key: string): Entry | null;
  backlinks(id: string): Entry[];
  unresolved: UnresolvedRef[];
}

const normalise = (key: string) => key.trim().toLowerCase();

function indexBy(entries: Entry[], keyOf: (e: Entry) => string | null) {
  const index = new Map<string, Entry>();
  for (const entry of entries) {
    const key = keyOf(entry);
    if (key && !index.has(normalise(key))) index.set(normalise(key), entry);
  }
  return index;
}

export function createResolver(entries: Entry[]): Resolver {
  // With several logs on one day, the file named after just the date wins.
  const logs = entries
    .filter((e) => e.kind === "log")
    .sort((a, b) => Number(b.id.endsWith(`/${b.date}`)) - Number(a.id.endsWith(`/${a.date}`)));

  const indexes = [
    indexBy(logs, (e) => e.date),
    indexBy(entries, (e) => e.portflowNaam),
    indexBy(entries, (e) => e.title),
  ];

  const resolve = (key: string) => {
    for (const index of indexes) {
      const hit = index.get(normalise(key));
      if (hit) return hit;
    }
    return null;
  };

  const backlinks = new Map<string, Entry[]>();
  const unresolved: UnresolvedRef[] = [];
  for (const entry of entries) {
    for (const key of entry.refs) {
      const target = resolve(key);
      if (!target) {
        unresolved.push({ from: entry.id, key });
        continue;
      }
      const list = backlinks.get(target.id) ?? [];
      if (!list.includes(entry)) backlinks.set(target.id, [...list, entry]);
    }
  }

  return {
    resolve,
    backlinks: (id) => backlinks.get(id) ?? [],
    unresolved,
  };
}
