import type { Entry as EntryModel } from "@logboeker/core";
import { cn } from "cn";
import { X } from "lucide-react";
import { createContext, useContext, type ComponentProps } from "react";
import { PATHS } from "@logboeker/vault";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Attachment } from "@/features/attachments/attachment";
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

function CloseButton({ id, label }: { id: string; label: string }) {
  const { close } = useStack();
  return (
    <Button variant="ghost" size="icon" aria-label={`${label} sluiten`} onClick={() => close(id)}>
      <X />
    </Button>
  );
}

function Item({ entry }: { entry: EntryModel }) {
  return (
    <Entry.Root entry={entry} className="shadow-none">
      <Entry.Header>
        <Entry.Title />
        <Entry.Meta />
        <Entry.Actions>
          <Entry.EditButton />
          <CloseButton id={entry.id} label={entry.title} />
        </Entry.Actions>
      </Entry.Header>
      <Entry.Body />
      <Entry.Attachments />
    </Entry.Root>
  );
}

function FileItem({ name }: { name: string }) {
  const { show } = useStack();
  const { entries, fileUrl } = useVault();
  const usedIn = entries.filter((entry) => entry.attachments.includes(name));

  return (
    <Card className="gap-4 shadow-none">
      <CardHeader>
        <CardTitle className="truncate font-mono text-sm">{name}</CardTitle>
        <CardDescription>Bijlage</CardDescription>
        <CardAction>
          <CloseButton id={`${PATHS.files}/${name}`} label={name} />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <Attachment.Root name={name} url={fileUrl(name)} defaultOpen>
          <Attachment.Trigger />
          <Attachment.Preview />
        </Attachment.Root>
        <div className="space-y-1.5">
          <h4 className="text-xs font-medium text-muted-foreground">Gebruikt in</h4>
          {usedIn.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen entry verwijst naar dit bestand.</p>
          ) : (
            <ul className="space-y-1">
              {usedIn.map((entry) => (
                <li key={entry.id}>
                  <Button variant="link" className="h-auto p-0" onClick={() => show(entry.id)}>
                    {entry.title}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Items({ className, ...props }: ComponentProps<"div">) {
  const { open } = useStack();
  const { entries, files } = useVault();
  const filePrefix = `${PATHS.files}/`;

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className={cn("space-y-4 p-4", className)} {...props}>
        {open.map((id) => {
          const entry = entries.find((e) => e.id === id);
          if (entry) return <Item key={id} entry={entry} />;
          const name = id.startsWith(filePrefix) ? id.slice(filePrefix.length) : null;
          return name && files.includes(name) ? <FileItem key={id} name={name} /> : null;
        })}
      </div>
    </ScrollArea>
  );
}

export const ReferenceStack = { Root, Header, Items, Item, FileItem };
