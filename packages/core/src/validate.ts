import type { Entry } from "./entry";
import type { Resolver } from "./resolve";
import type { Roadmap } from "./roadmap";
import { isNiveau, isVaardigheid } from "./vaardigheden";

export type DiagnosticCode =
  | "invalid-frontmatter"
  | "unknown-vaardigheid"
  | "invalid-niveau"
  | "unresolved-ref"
  | "missing-attachment"
  | "span-in-check-in"
  | "similar-doel"
  | "ongepland-doel"
  | "invalid-roadmap"
  | "unknown-doel";

export interface Diagnostic {
  entryId: string;
  code: DiagnosticCode;
  severity: "error" | "warning";
  message: string;
}

export interface ValidationContext {
  resolver: Resolver;
  files: ReadonlySet<string>;
  doelen: readonly string[];
  gepland?: ReadonlySet<string>;
}

export const ROADMAP_ID = "logboek/roadmap";

function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j]! + 1,
        current[j - 1]! + 1,
        previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length]!;
}

function looksLikeVariant(a: string, b: string) {
  return a !== b && Math.min(a.length, b.length) > 4 && (a.startsWith(b) || b.startsWith(a) || editDistance(a, b) <= 2);
}

export function findSimilarDoel(doel: string, doelen: readonly string[]): string | undefined {
  return doelen.find((other) => looksLikeVariant(doel, other));
}

export function validateEntry(entry: Entry, context: ValidationContext): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const report = (code: DiagnosticCode, severity: Diagnostic["severity"], message: string) =>
    diagnostics.push({ entryId: entry.id, code, severity, message });

  for (const issue of entry.frontmatterIssues) {
    report("invalid-frontmatter", "error", issue.field ? `${issue.field}: ${issue.message}` : issue.message);
  }

  for (const slug of entry.frontmatter.vaardigheden.filter((s) => !isVaardigheid(s))) {
    report("unknown-vaardigheid", "error", `Onbekende vaardigheid "${slug}" in de frontmatter`);
  }

  for (const span of entry.spans) {
    const excerpt = span.text.length > 40 ? `${span.text.slice(0, 40)}…` : span.text;
    for (const cls of span.unknownClasses) {
      report("unknown-vaardigheid", "error", `Onbekende vaardigheid ".${cls}" bij "${excerpt}"`);
    }
    if (span.vaardigheden.length > 0 && (span.niveau === null || !isNiveau(span.niveau))) {
      report("invalid-niveau", "error", `Geen geldig niveau (1-4) bij "${excerpt}"`);
    }
    if (span.inCheckIn) {
      report("span-in-check-in", "warning", `Label in de check-in bij "${excerpt}": planning is geen bewijs`);
    }
  }

  for (const key of entry.refs.filter((k) => !context.resolver.resolve(k))) {
    report("unresolved-ref", "error", `Verwijzing @${key} wijst nergens heen`);
  }

  for (const name of entry.attachments.filter((n) => !context.files.has(n))) {
    report("missing-attachment", "error", `Bijlage ${name} staat niet in logboek/files`);
  }

  for (const doel of entry.doelen) {
    const variant = findSimilarDoel(doel, context.doelen);
    if (variant) report("similar-doel", "warning", `Doel "${doel}" lijkt op bestaand doel "${variant}"`);
    else if (context.gepland?.size && !context.gepland.has(doel)) {
      report("ongepland-doel", "warning", `Doel "${doel}" staat niet in de roadmap`);
    }
  }

  return diagnostics;
}

export function validateRoadmap(roadmap: Roadmap, resolver: Resolver): Diagnostic[] {
  const report = (code: DiagnosticCode, message: string): Diagnostic => ({
    entryId: ROADMAP_ID,
    code,
    severity: "error",
    message,
  });

  return [
    ...roadmap.issues.map((issue) => report(issue.code, issue.message)),
    // Planned evidence may not exist yet; only a reached milestone must point somewhere.
    ...roadmap.mijlpalen
      .filter((m) => m.behaald)
      .flatMap((m) =>
        m.bewijs
          .filter((key) => !resolver.resolve(key))
          .map((key) =>
            report("unresolved-ref", `Mijlpaal "${m.titel}" is behaald, maar bewijs "${key}" bestaat niet`),
          ),
      ),
    ...roadmap.refs
      .filter((key) => !resolver.resolve(key))
      .map((key) => report("unresolved-ref", `Verwijzing @${key} wijst nergens heen`)),
  ];
}
