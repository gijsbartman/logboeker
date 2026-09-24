import { findSimilarDoel } from "@logboeker/core";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { humanise, slugify } from "@/lib/format";

type DoelenFieldProps = {
  value: string[];
  options: string[];
  onChange: (doelen: string[]) => void;
};

export function DoelenField({ value, options, onChange }: DoelenFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const slug = slugify(query);
  const similar =
    slug && !options.includes(slug)
      ? findSimilarDoel(slug, options)
      : undefined;

  const add = (doel: string) => {
    onChange([...value, doel]);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="editor-goals flex flex-wrap items-center gap-2">
      <span className="mr-2 shrink-0 text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
        Doel
      </span>
      {value.map((doel) => (
        <Badge
          key={doel}
          variant="outline"
          className="gap-1.5 rounded-sm border-transparent bg-muted px-2 py-1 font-normal"
        >
          {humanise(doel)}
          <button
            type="button"
            aria-label={`${humanise(doel)} verwijderen`}
            onClick={() => onChange(value.filter((d) => d !== doel))}
            className="rounded-sm p-0.5 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Doel toevoegen"
            className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-primary"
          >
            <Plus />
            Doel
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-0">
          <Command>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Zoek of maak een doel…"
            />
            <CommandList>
              <CommandEmpty>Typ een naam voor een nieuw doel.</CommandEmpty>
              <CommandGroup heading="Bestaande doelen">
                {options
                  .filter((doel) => !value.includes(doel))
                  .map((doel) => (
                    <CommandItem
                      key={doel}
                      value={doel}
                      onSelect={() => add(doel)}
                    >
                      {humanise(doel)}
                    </CommandItem>
                  ))}
              </CommandGroup>
              {slug && !options.includes(slug) && (
                <CommandGroup heading="Nieuw doel">
                  <CommandItem
                    value={`nieuw ${slug} ${query}`}
                    onSelect={() => add(slug)}
                    className="flex-col items-start"
                  >
                    <span>{slug} toevoegen</span>
                    {similar && (
                      <span className="text-xs text-destructive">
                        Lijkt op bestaand doel “{similar}”
                      </span>
                    )}
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
