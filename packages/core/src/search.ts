import MiniSearch from "minisearch";
import type { Entry } from "./entry";
import { VAARDIGHEID_LABELS } from "./vaardigheden";

export interface SearchHit {
  entry: Entry;
  score: number;
  terms: string[];
  snippet: string;
}

export interface SearchIndex {
  search(query: string, limit?: number): SearchHit[];
}

type Document = {
  id: string;
  title: string;
  portflowNaam: string;
  date: string;
  doelen: string;
  vaardigheden: string;
  text: string;
  attachments: string;
};

const normalise = (term: string) =>
  term
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

function snippetFor(text: string, terms: string[], radius = 80): string {
  const haystack = normalise(text);
  const positions = terms.map((t) => haystack.indexOf(normalise(t))).filter((i) => i >= 0);
  const at = positions.length > 0 ? Math.min(...positions) : 0;
  const start = Math.max(0, at - radius);
  const end = Math.min(text.length, at + radius);
  const flat = text.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "…" : ""}${flat}${end < text.length ? "…" : ""}`;
}

export function createSearchIndex(entries: Entry[], attachmentText: (name: string) => string = () => ""): SearchIndex {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const index = new MiniSearch<Document>({
    fields: ["title", "portflowNaam", "date", "doelen", "vaardigheden", "text", "attachments"],
    processTerm: (term) => normalise(term),
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      combineWith: "AND",
      boost: { title: 3, portflowNaam: 3, doelen: 2, vaardigheden: 1.5 },
    },
  });

  index.addAll(
    entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      portflowNaam: entry.portflowNaam ?? "",
      date: entry.date ?? "",
      doelen: entry.doelen.join(" ").replace(/-/g, " "),
      vaardigheden: entry.vaardigheden.map((v) => VAARDIGHEID_LABELS[v]).join(" "),
      text: entry.text,
      attachments: entry.attachments.map((name) => `${name} ${attachmentText(name)}`).join(" "),
    })),
  );

  return {
    search(query, limit = 20) {
      return index
        .search(query)
        .slice(0, limit)
        .map((result) => {
          const entry = byId.get(result.id)!;
          return { entry, score: result.score, terms: result.terms, snippet: snippetFor(entry.text, result.terms) };
        });
    },
  };
}
