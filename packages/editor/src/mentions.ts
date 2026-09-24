import { NIVEAUS, VAARDIGHEDEN, VAARDIGHEID_LABELS } from "@logboeker/core";
import {
  autocompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
  type CompletionSection,
} from "@codemirror/autocomplete";

export type MentionItem = {
  kind: "log" | "bewijs" | "file";
  label: string;
  insert: string;
  detail?: string;
  info?: string;
};

const SECTIONS: Record<MentionItem["kind"], CompletionSection> = {
  log: { name: "Logs", rank: 0 },
  bewijs: { name: "Bewijs", rank: 1 },
  file: { name: "Bijlagen", rank: 2 },
};

export function mentionSource(getItems: () => MentionItem[]) {
  return (context: CompletionContext): CompletionResult | null => {
    const match = context.matchBefore(/(?<![\w@])@(?:\[[^\]\n]*|\{[^}\n]*|[\w.-]*)$/);
    if (!match) return null;
    const opener = match.text[1];
    const queryFrom = match.from + 1 + (opener === "[" || opener === "{" ? 1 : 0);

    return {
      from: queryFrom,
      options: getItems().map(
        (item): Completion => ({
          label: item.label,
          detail: item.detail,
          info: item.info,
          type: item.kind === "file" ? "file" : "text",
          section: SECTIONS[item.kind],
          apply: (view, _completion, _from, to) =>
            view.dispatch({
              changes: { from: match.from, to, insert: item.insert },
              selection: { anchor: match.from + item.insert.length },
            }),
        }),
      ),
    };
  };
}

const ATTR_OPTIONS: Completion[] = [
  ...VAARDIGHEDEN.map((v) => ({ label: `.${v}`, detail: VAARDIGHEID_LABELS[v], type: "keyword" })),
  ...NIVEAUS.map((n) => ({ label: `niveau=${n}`, type: "property" })),
];

export function spanAttrSource(context: CompletionContext): CompletionResult | null {
  if (!context.matchBefore(/\]\{[^}\n]*$/)) return null;
  const word = context.matchBefore(/[.\w=-]*$/)!;
  return { from: word.from, options: ATTR_OPTIONS, validFor: /^[.\w=-]*$/ };
}

export function mentions(getItems: () => MentionItem[]) {
  return autocompletion({ override: [mentionSource(getItems), spanAttrSource], icons: false });
}
