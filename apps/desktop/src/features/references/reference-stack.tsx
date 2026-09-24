import {
  VAARDIGHEID_LABELS,
  type DoelVoortgang,
  type Entry as EntryModel,
  type MijlpaalVoortgang,
  type RoadmapEdit,
} from "@logboeker/core";
import { cn } from "cn";
import { Check, Pencil, RotateCcw, Trash2, X } from "lucide-react";
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
import {
  DOEL_PREFIX,
  DOEL_STATUS,
  doelRef,
  MIJLPAAL_PREFIX,
  mijlpaalLabel,
  mijlpaalRef,
  today,
  useEditRoadmap,
  useRoadmap,
} from "@/features/calendar/use-roadmap";
import { DoelDialog, MijlpaalDialog } from "@/features/calendar/roadmap-forms";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Entry } from "@/features/entries/entry";
import { formatShortDate } from "@/lib/format";
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

function RoadmapActions({
  done,
  doneLabel,
  undoLabel,
  onToggle,
  onEdit,
  onDelete,
  deleteWarning,
}: {
  done: boolean;
  doneLabel: string;
  undoLabel: string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleteWarning: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t pt-4">
      <Button variant="outline" size="sm" onClick={onToggle}>
        {done ? <RotateCcw /> : <Check />}
        {done ? undoLabel : doneLabel}
      </Button>
      <Button variant="ghost" size="sm" onClick={onEdit}>
        <Pencil /> Bewerken
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="ml-auto">
            <Trash2 /> Verwijderen
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 space-y-3 text-sm">
          <p>{deleteWarning}</p>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            Definitief verwijderen
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function useRoadmapAction() {
  const edit = useEditRoadmap();
  return (edits: RoadmapEdit[], onSuccess?: () => void) =>
    edit.mutate(edits, {
      onSuccess,
      onError: (error) => toast.error(error.message),
    });
}

function DoelItem({
  lane,
  mijlpalen,
}: {
  lane: DoelVoortgang;
  mijlpalen: MijlpaalVoortgang[];
}) {
  const { show, close } = useStack();
  const { doel } = lane;
  const apply = useRoadmapAction();
  const [editing, setEditing] = useState(false);

  const remove = () =>
    apply(
      [
        ...mijlpalen.map(({ mijlpaal }): RoadmapEdit => ({
          list: "mijlpalen",
          action: "update",
          index: mijlpaal.index,
          fields: { doel: null },
        })),
        { list: "doelen", action: "remove", index: doel.index },
      ],
      () => close(doelRef(doel.slug)),
    );

  return (
    <Card className="reference-file gap-5 shadow-none">
      <CardHeader>
        <CardTitle className="text-sm">{doel.titel}</CardTitle>
        <CardDescription className="text-[10px] tracking-[0.12em] uppercase">
          Doel · {DOEL_STATUS[lane.status]}
        </CardDescription>
        <CardAction>
          <CloseButton id={doelRef(doel.slug)} label={doel.titel} />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          {formatShortDate(doel.van)} tot {formatShortDate(doel.tot)}
          {doel.afgerond && `, afgerond ${formatShortDate(doel.afgerond)}`}
        </p>
        {mijlpalen.length > 0 && (
          <Section title="Mijlpalen">
            <ul className="space-y-1">
              {mijlpalen.map((m) => (
                <li key={m.mijlpaal.index}>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-xs"
                    onClick={() => show(mijlpaalRef(m.mijlpaal.index))}
                  >
                    {m.mijlpaal.titel}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {" "}
                    · {mijlpaalLabel(m)}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}
        <Section title="Entries">
          <EntryLinks
            entries={lane.entries}
            empty="Nog geen entry met dit doel."
          />
        </Section>
        <RoadmapActions
          done={!!doel.afgerond}
          doneLabel="Afgerond"
          undoLabel="Heropenen"
          onToggle={() =>
            apply([
              {
                list: "doelen",
                action: "update",
                index: doel.index,
                fields: { afgerond: doel.afgerond ? null : today() },
              },
            ])
          }
          onEdit={() => setEditing(true)}
          onDelete={remove}
          deleteWarning="Het doel verdwijnt uit de roadmap. Entries en mijlpalen blijven bestaan."
        />
        <DoelDialog open={editing} onOpenChange={setEditing} doel={doel} />
      </CardContent>
    </Card>
  );
}

function MijlpaalItem({
  voortgang,
  lane,
}: {
  voortgang: MijlpaalVoortgang;
  lane: DoelVoortgang | undefined;
}) {
  const { show, rewrite } = useStack();
  const { mijlpaal } = voortgang;
  const apply = useRoadmapAction();
  const [editing, setEditing] = useState(false);

  // Milestone ids are list positions, so later open cards shift up by one.
  const remove = () =>
    apply(
      [{ list: "mijlpalen", action: "remove", index: mijlpaal.index }],
      () =>
        rewrite((ids) =>
          ids.flatMap((id) => {
            if (!id.startsWith(MIJLPAAL_PREFIX)) return [id];
            const index = Number(id.slice(MIJLPAAL_PREFIX.length));
            if (index === mijlpaal.index) return [];
            return [index > mijlpaal.index ? mijlpaalRef(index - 1) : id];
          }),
        ),
    );

  return (
    <Card className="reference-file gap-5 shadow-none">
      <CardHeader>
        <CardTitle className="text-sm">{mijlpaal.titel}</CardTitle>
        <CardDescription className="text-[10px] tracking-[0.12em] uppercase">
          Mijlpaal · {mijlpaalLabel(voortgang)}
        </CardDescription>
        <CardAction>
          <CloseButton
            id={mijlpaalRef(mijlpaal.index)}
            label={mijlpaal.titel}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          Gepland op {formatShortDate(mijlpaal.datum)}
          {mijlpaal.vaardigheden.length > 0 &&
            ` · ${mijlpaal.vaardigheden.map((v) => VAARDIGHEID_LABELS[v]).join(", ")}`}
          {mijlpaal.niveau !== null && ` niveau ${mijlpaal.niveau}`}
        </p>
        {lane && (
          <p className="text-xs">
            Hoort bij{" "}
            <Button
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={() => show(doelRef(lane.doel.slug))}
            >
              {lane.doel.titel}
            </Button>
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
        <RoadmapActions
          done={!!mijlpaal.behaald}
          doneLabel="Behaald"
          undoLabel="Niet behaald"
          onToggle={() =>
            apply([
              {
                list: "mijlpalen",
                action: "update",
                index: mijlpaal.index,
                fields: { behaald: mijlpaal.behaald ? null : today() },
              },
            ])
          }
          onEdit={() => setEditing(true)}
          onDelete={remove}
          deleteWarning="De mijlpaal verdwijnt uit de roadmap. Gekoppeld bewijs blijft bestaan."
        />
        <MijlpaalDialog
          open={editing}
          onOpenChange={setEditing}
          mijlpaal={mijlpaal}
        />
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
          if (id.startsWith(DOEL_PREFIX)) {
            const slug = id.slice(DOEL_PREFIX.length);
            const lane = roadmap.doelen.find((d) => d.doel.slug === slug);
            return lane ? (
              <DoelItem
                key={id}
                lane={lane}
                mijlpalen={roadmap.mijlpalen.filter(
                  (m) => m.mijlpaal.doel === slug,
                )}
              />
            ) : null;
          }
          if (id.startsWith(MIJLPAAL_PREFIX)) {
            const index = Number(id.slice(MIJLPAAL_PREFIX.length));
            const voortgang = roadmap.mijlpalen.find(
              (m) => m.mijlpaal.index === index,
            );
            return voortgang ? (
              <MijlpaalItem
                key={id}
                voortgang={voortgang}
                lane={roadmap.doelen.find(
                  (d) => d.doel.slug === voortgang.mijlpaal.doel,
                )}
              />
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
