// De tien vaste vaardigheidsslugs. Evaluator en toezichthouder filteren
// hierop, dus deze lijst verandert niet zonder dat de vault mee verandert.
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

export function isVaardigheid(value: string): value is Vaardigheid {
  return (VAARDIGHEDEN as readonly string[]).includes(value);
}
