import type { EntryKind } from "@logboeker/core";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { useReferences } from "@/features/references/use-references";
import { formatDate } from "@/lib/format";
import { useVault } from "@/lib/vault";
import { Highlight } from "./highlight";

const GROUPS: { kind: EntryKind; heading: string }[] = [
  { kind: "log", heading: "Logs" },
  { kind: "bewijs", heading: "Bewijs" },
];

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { search } = useVault();
  const references = useReferences();
  const hits = query.trim() ? search.search(query) : [];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const select = (id: string) => {
    references.show(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <Button variant="outline" size="sm" className="text-muted-foreground" onClick={() => setOpen(true)}>
        <Search />
        Zoeken
        <Kbd>⌘K</Kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Zoeken" description="Zoek in logs, bewijs en bijlagen">
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Zoek in logs, bewijs en bijlagen…" />
          <CommandList>
            {query.trim() && <CommandEmpty>Niets gevonden.</CommandEmpty>}
            {GROUPS.map(({ kind, heading }) => {
              const inGroup = hits.filter((hit) => hit.entry.kind === kind);
              if (inGroup.length === 0) return null;
              return (
                <CommandGroup key={kind} heading={heading}>
                  {inGroup.map(({ entry, terms, snippet }) => (
                    <CommandItem key={entry.id} value={entry.id} onSelect={select} className="flex-col items-start gap-0.5">
                      <div className="flex w-full items-baseline justify-between gap-3">
                        <span className="truncate font-medium">
                          <Highlight text={entry.title} terms={terms} />
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">{formatDate(entry.date)}</span>
                      </div>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        <Highlight text={snippet} terms={terms} />
                      </p>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
