export const VAARDIGHEDEN = [
  "juiste-kennis-ontwikkelen",
  "kwalitatief-product-maken",
  "overzicht-creeren",
  "kritisch-oordelen",
  "samenwerken",
  "boodschap-delen",
  "plannen",
  "flexibel-opstellen",
  "pro-actief-handelen",
  "reflecteren",
] as const;

export type Vaardigheid = (typeof VAARDIGHEDEN)[number];

export const VAARDIGHEID_LABELS: Record<Vaardigheid, string> = {
  "juiste-kennis-ontwikkelen": "Juiste kennis ontwikkelen",
  "kwalitatief-product-maken": "Kwalitatief product maken",
  "overzicht-creeren": "Overzicht creëren",
  "kritisch-oordelen": "Kritisch oordelen",
  samenwerken: "Samenwerken",
  "boodschap-delen": "Boodschap delen",
  plannen: "Plannen",
  "flexibel-opstellen": "Flexibel opstellen",
  "pro-actief-handelen": "Pro-actief handelen",
  reflecteren: "Reflecteren",
};

export const BEROEPSTAAK_PREFIX = "bt-";

export function isVaardigheid(value: string): value is Vaardigheid {
  return (VAARDIGHEDEN as readonly string[]).includes(value);
}

export const NIVEAUS = [1, 2, 3, 4] as const;

export function isNiveau(value: number): boolean {
  return (NIVEAUS as readonly number[]).includes(value);
}
