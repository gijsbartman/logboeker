import type { ReactNode } from "react";
import { useVault } from "@/lib/vault";
import { useReferences } from "./use-references";

type EntryReferenceProps = {
  refKey?: string;
  children?: ReactNode;
};

export function EntryReference({ refKey = "", children }: EntryReferenceProps) {
  const { resolver } = useVault();
  const references = useReferences();
  const target = resolver.resolve(refKey);

  if (!target) {
    return (
      <span title="Verwijzing niet gevonden" className="text-muted-foreground line-through decoration-destructive">
        {children}
      </span>
    );
  }

  const open = references.isOpen(target.id);
  return (
    <button
      type="button"
      aria-pressed={open}
      title={target.title}
      onClick={() => references.toggle(target.id)}
      className="cursor-pointer rounded-sm font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary aria-pressed:bg-accent"
    >
      {children}
    </button>
  );
}
