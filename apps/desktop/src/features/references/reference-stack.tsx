import {
  VAARDIGHEID_LABELS,
  type Entry as EntryModel,
  type ItemVoortgang,
} from "@logboeker/core";
import { cn } from "cn";
import { Check, Pencil, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
  useState,
} from "react";
import { PATHS } from "@logboeker/vault";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Attachment } from "@/features/attachments/attachment";
import { ItemDialog } from "@/features/calendar/roadmap-forms";
import {
  ITEM_PREFIX,
  itemLabel,
  itemPeriod,
  itemRef,
  today,
  useEditRoadmap,
  useRoadmap,
} from "@/features/calendar/use-roadmap";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Entry } from "@/features/entries/entry";
import { humanise } from "@/lib/format";
import { useVault } from "@/lib/vault";
import { useReferences } from "./use-references";
import "@/features/editorial.css";

const StackContext = createContext<ReturnType<typeof useReferences> | null>(
  null,
);

function useStack() {
  const context = useContext(StackContext);
  if (!context)
    throw new Error(
      "ReferenceStack parts must be used inside <ReferenceStack.Root>",
    );
  return context;
}

function Root({ className, children, ...props }: ComponentProps<"aside">) {
  const references = useReferences();
  return (
    <StackContext.Provider value={references}>
      <aside
        data-slot="reference-stack"
        className={cn("reference-rail flex h-full flex-col", className)}
        {...props}
      >
        {children}
      </aside>
    </StackContext.Provider>
  );
}

function Header({ className, ...props }: ComponentProps<"header">) {
  const { open, closeAll } = useStack();
  return (
    <header
      className={cn(
        "reference-header flex items-center justify-between gap-2 border-b px-5 py-5",
        className,
      )}
      {...props}
    >
      <div>
        <p className="mb-1.5 text-[9px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
          Ernaast gelegd
        </p>
        <h2 className="reference-heading">
          {open.length === 1 ? "1 verwijzing" : `${open.length} verwijzingen`}
        </h2>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-[10px] text-muted-foreground"
        onClick={closeAll}
      >
        Alles sluiten
      </Button>
    </header>
  );
}

function CloseButton({ id, label }: { id: string; label: string }) {
  const { close } = useStack();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground"
      aria-label={`${label} sluiten`}
      onClick={() => close(id)}
    >
      <X className="size-3.5" />
    </Button>
  );
}

function Item({ entry }: { entry: EntryModel }) {
  return (
    <Entry.Root entry={entry} className="reference-page shadow-none">
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
  const { entries, fileUrl, openFile } = useVault();
  const usedIn = entries.filter((entry) => entry.attachments.includes(name));

  return (
    <Card className="reference-file gap-5 shadow-none">
      <CardHeader>
        <CardTitle className="truncate text-sm">{name}</CardTitle>
        <CardDescription className="text-[10px] tracking-[0.12em] uppercase">
          Bijlage
        </CardDescription>
        <CardAction>
          <CloseButton id={`${PATHS.files}/${name}`} label={name} />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <Attachment.Root
          name={name}
          url={fileUrl(name)}
          openExternally={() => openFile(name)}
          defaultOpen
        >
          <Attachment.Trigger />
          <Attachment.Preview />
        </Attachment.Root>
        <Section title="Gebruikt in">
          <EntryLinks
            entries={usedIn}
            empty="Geen entry verwijst naar dit bestand."
          />
        </Section>
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2 border-t pt-4">
      <h4 className="text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
        {title}
      </h4>
      {children}
    </div>
  );
}

function EntryLinks({
  entries,
  empty,
}: {
  entries: EntryModel[];
  empty: string;
}) {
  const { show } = useStack();
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="space-y-1">
      {entries.map((entry) => (
        <li key={entry.id}>
          <Button
            variant="link"
            className="h-auto p-0 text-xs"
            onClick={() => show(entry.id)}
          >
            {entry.title}
          </Button>
        </li>
      ))}
    </ul>
  );
}

function RoadmapItemCard({ voortgang }: { voortgang: ItemVoortgang }) {
  const { show } = useStack();
  const { item } = voortgang;
  const edit = useEditRoadmap();
  const [editing, setEditing] = useState(false);

  const toggleDone = () =>
    edit.mutate(
      [
        {
          action: "update",
          index: item.index,
          fields: { afgerond: item.afgerond ? null : today() },
        },
      ],
      { onError: (error) => toast.error(error.message) },
    );

  return (
    <Card className="reference-file gap-5 shadow-none">
      <CardHeader>
        <CardTitle className="text-sm">{item.titel}</CardTitle>
        <CardDescription className="text-[10px] tracking-[0.12em] uppercase">
          {itemPeriod(voortgang)} · {itemLabel(voortgang)}
        </CardDescription>
        <CardAction>
          <CloseButton id={itemRef(item.index)} label={item.titel} />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {(item.doel || item.vaardigheden.length > 0) && (
          <p className="text-sm">
            {[
              item.doel && `Doel: ${humanise(item.doel)}`,
              item.vaardigheden.map((v) => VAARDIGHEID_LABELS[v]).join(", "),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        <Section title="Bewijs">
          {voortgang.bewijsstukken.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Geen bewijs gekoppeld.
            </p>
          ) : (
            <ul className="space-y-1">
              {voortgang.bewijsstukken.map(({ key, entry }) => (
                <li key={key}>
                  {entry ? (
                    <Button
                      variant="link"
                      className="h-auto p-0 text-xs"
                      onClick={() => show(entry.id)}
                    >
                      {entry.title}
                    </Button>
                  ) : (
                    <span
                      className="text-xs text-muted-foreground"
                      title="Verwijzing niet gevonden"
                    >
                      {key} · ontbreekt
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
        {item.doel && (
          <Section title="Entries met dit doel">
            <EntryLinks
              entries={voortgang.entries}
              empty="Nog geen entry met dit doel."
            />
          </Section>
        )}
        <div className="flex flex-wrap items-center gap-1.5 border-t pt-4">
          <Button variant="outline" size="sm" onClick={toggleDone}>
            {item.afgerond ? <RotateCcw /> : <Check />}
            {item.afgerond ? "Heropenen" : "Afgerond"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil /> Bewerken
          </Button>
        </div>
        <ItemDialog open={editing} onOpenChange={setEditing} item={item} />
      </CardContent>
    </Card>
  );
}

function Items({ className, ...props }: ComponentProps<"div">) {
  const { open } = useStack();
  const { entries, files } = useVault();
  const roadmap = useRoadmap();
  const filePrefix = `${PATHS.files}/`;

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className={cn("reference-pages px-5", className)} {...props}>
        {open.map((id) => {
          const entry = entries.find((e) => e.id === id);
          if (entry) return <Item key={id} entry={entry} />;
          if (id.startsWith(ITEM_PREFIX)) {
            const index = Number(id.slice(ITEM_PREFIX.length));
            const voortgang = roadmap.items.find((v) => v.item.index === index);
            return voortgang ? (
              <RoadmapItemCard key={id} voortgang={voortgang} />
            ) : null;
          }
          const name = id.startsWith(filePrefix)
            ? id.slice(filePrefix.length)
            : null;
          return name && files.includes(name) ? (
            <FileItem key={id} name={name} />
          ) : null;
        })}
      </div>
    </ScrollArea>
  );
}

export const ReferenceStack = { Root, Header, Items, Item, FileItem };
