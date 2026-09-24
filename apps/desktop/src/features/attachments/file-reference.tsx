import type { ReactNode } from "react";
import { useEntry } from "@/features/entries/entry-context";
import { useVault } from "@/lib/vault";

type FileReferenceProps = {
  name?: string;
  children?: ReactNode;
};

export function FileReference({ name = "", children }: FileReferenceProps) {
  const { files } = useVault();
  const { openFiles, toggleFile } = useEntry();

  if (!files.includes(name)) {
    return (
      <span title="Bestand niet gevonden in logboek/files" className="text-muted-foreground line-through decoration-destructive">
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-expanded={openFiles.includes(name)}
      onClick={() => toggleFile(name)}
      className="cursor-pointer rounded-sm font-mono text-[0.9em] text-primary underline decoration-dotted underline-offset-4 aria-expanded:bg-accent"
    >
      {children}
    </button>
  );
}
