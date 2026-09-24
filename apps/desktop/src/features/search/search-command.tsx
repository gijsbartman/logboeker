import type { EntryKind } from "@logboeker/core";
import { ArrowUpRight, Search } from "lucide-react";
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
import "@/features/editorial.css";

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
      <Button
        variant="ghost"
        size="sm"
        className="search-trigger h-9 gap-2.5 rounded-full px-3 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="size-3.5" />
        Zoeken
        <Kbd className="ml-3 bg-transparent text-[10px] text-muted-foreground/70">
          ⌘K
        </Kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Zoeken"
        description="Zoek in logs, bewijs en bijlagen"
        className="journal-search"
      >
        <div className="search-heading">
          <span className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Je archief
          </span>
          <p>Vind de draad terug.</p>
        </div>
        <Command shouldFilter={false} className="journal-search-command">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Zoek in logs, bewijs en bijlagen…"
          />
          <CommandList>
            {!query.trim() && (
              <div className="search-empty">
                <Search
                  className="mb-3 size-5 text-primary/70"
                  aria-hidden="true"
                />
                <p>Een gedachte, een doel, een moment.</p>
                <span>Begin met typen om je logboek te doorzoeken.</span>
              </div>
            )}
            {query.trim() && (
              <CommandEmpty className="py-12 text-muted-foreground">
                Niets gevonden.
              </CommandEmpty>
            )}
            {GROUPS.map(({ kind, heading }) => {
              const inGroup = hits.filter((hit) => hit.entry.kind === kind);
              if (inGroup.length === 0) return null;
              return (
                <CommandGroup key={kind} heading={heading}>
                  {inGroup.map(({ entry, terms, snippet }) => (
                    <CommandItem
                      key={entry.id}
                      value={entry.id}
                      onSelect={select}
                      className="search-result flex-col items-start gap-1.5"
                    >
                      <div className="flex w-full items-baseline justify-between gap-3">
                        <span className="search-result-title truncate">
                          <Highlight text={entry.title} terms={terms} />
                        </span>
                        <span className="flex shrink-0 items-center gap-3 text-[10px] text-muted-foreground">
                          {formatDate(entry.date)}
                          <ArrowUpRight
                            className="size-3.5"
                            aria-hidden="true"
                          />
                        </span>
                      </div>
                      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        <Highlight text={snippet} terms={terms} />
                      </p>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
        <div className="search-footer flex items-center justify-between border-t text-[10px] text-muted-foreground">
          <span>
            <Kbd>↵</Kbd> openen
          </span>
          <span>
            <Kbd>esc</Kbd> sluiten
          </span>
        </div>
      </CommandDialog>
    </>
  );
}
