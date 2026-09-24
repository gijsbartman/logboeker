import type { MentionItem } from "@logboeker/editor";
import type { Vault } from "@logboeker/vault";

export function mentionItems(vault: Vault): MentionItem[] {
  const entries = vault.entries.map((entry): MentionItem => {
    const name = entry.portflowNaam ?? entry.title;
    const byDate = entry.kind === "log" && entry.date !== null && vault.resolver.resolve(entry.date)?.id === entry.id;
    return {
      kind: entry.kind,
      label: entry.kind === "log" ? `${entry.date ?? ""} ${entry.title}`.trim() : name,
      insert: byDate ? `@${entry.date}` : `@[${name}]`,
      detail: entry.kind === "bewijs" ? (entry.date ?? undefined) : undefined,
      info: entry.text.slice(0, 240),
    };
  });
  const files = vault.files.map((name): MentionItem => ({ kind: "file", label: name, insert: `@{${name}}` }));
  return [...entries, ...files];
}
