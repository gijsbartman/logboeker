import { z } from "zod";
import { VAARDIGHEDEN, VAARDIGHEID_LABELS, type Vaardigheid } from "./vaardigheden";

const levelSchema = z.object({
  subtitle: z.string().nullish(),
  description: z.string().nullish(),
  extra_description: z.string().nullish(),
});

const lefSchema = z.record(
  z.string(),
  z.object({
    description: z.string().nullish(),
    level_description: z.record(z.string(), levelSchema).default({}),
  }),
);

export interface Level {
  subtitle: string | null;
  description: string | null;
  extra: string | null;
}

export interface Criteria {
  description: string | null;
  levels: Record<number, Level>;
}

export type CriteriaBook = Partial<Record<Vaardigheid, Criteria>>;

export function parseCriteria(json: unknown): CriteriaBook {
  const raw = lefSchema.parse(json);
  const book: CriteriaBook = {};

  for (const slug of VAARDIGHEDEN) {
    const source = raw[VAARDIGHEID_LABELS[slug]];
    if (!source) continue;
    book[slug] = {
      description: source.description ?? null,
      levels: Object.fromEntries(
        Object.entries(source.level_description).map(([niveau, level]) => [
          Number(niveau),
          {
            subtitle: level.subtitle ?? null,
            description: level.description ?? null,
            extra: level.extra_description ?? null,
          },
        ]),
      ),
    };
  }
  return book;
}
