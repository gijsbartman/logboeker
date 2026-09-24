import type { Entry as EntryModel } from "@logboeker/core";
import { cn } from "cn";
import { X } from "lucide-react";
import { createContext, useContext, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Entry } from "@/features/entries/entry";
import { useVault } from "@/lib/vault";
import { useReferences } from "./use-references";

const StackContext = createContext<ReturnType<typeof useReferences> | null>(null);

function useStack() {
  const context = useContext(StackContext);
  if (!context) throw new Error("ReferenceStack parts must be used inside <ReferenceStack.Root>");
  return context;
}

function Root({ className, children, ...props }: ComponentProps<"aside">) {
  const references = useReferences();
  return (
    <StackContext.Provider value={references}>
      <aside data-slot="reference-stack" className={cn("flex h-full flex-col bg-muted/30", className)} {...props}>
        {children}
      </aside>
    </StackContext.Provider>
  );
}

function Header({ className, ...props }: ComponentProps<"header">) {
  const { open, closeAll } = useStack();
  return (
    <header className={cn("flex items-center justify-between border-b px-4 py-3", className)} {...props}>
      <h2 className="text-sm font-medium">
        {open.length === 1 ? "1 verwijzing" : `${open.length} verwijzingen`}
      </h2>
      <Button variant="ghost" size="sm" onClick={closeAll}>
        Alles sluiten
      </Button>
    </header>
  );
}

function Item({ entry }: { entry: EntryModel }) {
  const { close } = useStack();
  return (
    <Entry.Root entry={entry} className="shadow-none">
      <Entry.Header>
        <Entry.Title />
        <Entry.Meta />
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${entry.title} sluiten`}
          onClick={() => close(entry.id)}
          className="col-start-2 row-span-2 row-start-1 self-start justify-self-end"
        >
          <X />
        </Button>
      </Entry.Header>
      <Entry.Body />
      <Entry.Attachments />
    </Entry.Root>
  );
}

function Items({ className, ...props }: ComponentProps<"div">) {
  const { open } = useStack();
  const { entries } = useVault();
  const opened = open.flatMap((id) => entries.filter((e) => e.id === id));

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className={cn("space-y-4 p-4", className)} {...props}>
        {opened.map((entry) => (
          <Item key={entry.id} entry={entry} />
        ))}
      </div>
    </ScrollArea>
  );
}

export const ReferenceStack = { Root, Header, Items, Item };
