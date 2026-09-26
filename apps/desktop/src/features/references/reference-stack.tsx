import {
  VAARDIGHEID_LABELS,
  type Entry as EntryModel,
  type ItemVoortgang,
} from "@logboeker/core";
import { cn } from "cn";
import { Circle, CircleCheck, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from "react";
import { PATHS } from "@logboeker/vault";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Attachment } from "@/features/attachments/attachment";
import { ItemEditor } from "@/features/calendar/item-editor";
import { TagToggle } from "@/features/filters/tag-toggle";
import { useFilters } from "@/features/filters/use-filters";
import { SkillDot } from "@/features/skills/skill-badge";
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
import { useUiStore } from "@/lib/ui-store";
import { useVault } from "@/lib/vault";
import { HoldHeightContext, useHoldHeight } from "./hold-height";
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
      size="icon-sm"
      className="text-muted-foreground"
      aria-label={`${label} sluiten`}
      onClick={() => close(id)}
    >
      <X />
    </Button>
  );
}

function Item({ entry }: { entry: EntryModel }) {
  return (
    <Entry.Root
      entry={entry}
      data-reference={entry.id}
      className="reference-page shadow-none"
    >
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
    <Card
      data-reference={`${PATHS.files}/${name}`}
      className="reference-file gap-5 shadow-none"
    >
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
  const filters = useFilters();
  const { item } = voortgang;
  const id = itemRef(item.index);
  const edit = useEditRoadmap();
  const editing = useUiStore((state) => state.editing === id);
  const startEditing = useUiStore((state) => state.edit);
  const hold = useHoldHeight();
  const card = useRef<HTMLElement>(null);
  const setEditing = (next: string | null) => {
    hold(card.current);
    startEditing(next);
  };

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
    <article
      ref={card}
      data-slot="entry"
      data-reference={id}
      data-editing={editing}
      className="journal-entry reference-page shadow-none"
    >
      <CardHeader>
        <h4 className="journal-entry-title">{item.titel}</h4>
        <CardDescription className="journal-entry-meta first-letter:uppercase">
          {itemPeriod(voortgang)} · {itemLabel(voortgang)}
        </CardDescription>
        <CardAction className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="journal-edit-button"
            aria-pressed={!!item.afgerond}
            aria-label={
              item.afgerond
                ? `${item.titel} heropenen`
                : `${item.titel} afronden`
            }
            onClick={toggleDone}
          >
            {item.afgerond ? <CircleCheck /> : <Circle />}
          </Button>
          {!editing && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="journal-edit-button"
              aria-label={`${item.titel} bewerken`}
              onClick={() => setEditing(id)}
            >
              <Pencil />
            </Button>
          )}
          <CloseButton id={id} label={item.titel} />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <ItemEditor item={item} onDone={() => setEditing(null)} />
        ) : (
          <>
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
          </>
        )}
      </CardContent>
      {!editing && (item.doel || item.vaardigheden.length > 0) && (
        <CardFooter className="journal-entry-tags">
          {item.doel && (
            <Entry.TagRow label="Doel">
              <TagToggle
                active={filters.isActive("doel", item.doel)}
                onToggle={() => filters.toggle("doel", item.doel!)}
              >
                {humanise(item.doel)}
              </TagToggle>
            </Entry.TagRow>
          )}
          {item.vaardigheden.length > 0 && (
            <Entry.TagRow label="Vaardigheid">
              {item.vaardigheden.map((skill) => (
                <TagToggle
                  key={skill}
                  active={filters.isActive("vaardigheid", skill)}
                  onToggle={() => filters.toggle("vaardigheid", skill)}
                >
                  <SkillDot vaardigheid={skill} />
                  {VAARDIGHEID_LABELS[skill]}
                </TagToggle>
              ))}
            </Entry.TagRow>
          )}
        </CardFooter>
      )}
    </article>
  );
}

// Opening a reference, also one that is already open, scrolls it into view
// and flashes it, so the click always visibly lands somewhere.
function useRevealed(open: string[]) {
  const container = useRef<HTMLDivElement>(null);
  const revealed = useUiStore((state) => state.revealed);
  const reveal = useUiStore((state) => state.reveal);

  useEffect(() => {
    if (!revealed) return;
    const frame = requestAnimationFrame(() => {
      const card = [
        ...(container.current?.querySelectorAll<HTMLElement>(
          "[data-reference]",
        ) ?? []),
      ].find((element) => element.dataset.reference === revealed);
      if (!card) return;
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      card.classList.remove("reference-flash");
      void card.offsetWidth;
      card.classList.add("reference-flash");
      reveal(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [revealed, open, reveal]);

  return container;
}

const RELEASE = ["wheel", "touchstart", "keydown"] as const;
const SETTLE_MS = 400;

function useHold(container: RefObject<HTMLDivElement | null>) {
  return useCallback(
    (from: Element | null) => {
      const element = container.current;
      const viewport = element?.closest<HTMLElement>(
        '[data-slot="scroll-area-viewport"]',
      );
      const card = from?.closest('[data-slot="entry"]');
      if (!element || !viewport) return;

      element.style.minHeight = `${element.offsetHeight}px`;
      const release = () => {
        element.style.minHeight = "";
        for (const type of RELEASE) viewport.removeEventListener(type, release);
      };
      for (const type of RELEASE)
        viewport.addEventListener(type, release, { passive: true });

      if (!card) return;
      const top = card.getBoundingClientRect().top;
      const pin = () => {
        const drift = card.getBoundingClientRect().top - top;
        if (Math.abs(drift) >= 1) viewport.scrollTop += drift;
      };
      viewport.addEventListener("scroll", pin);
      requestAnimationFrame(() => requestAnimationFrame(pin));
      setTimeout(() => viewport.removeEventListener("scroll", pin), SETTLE_MS);
    },
    [container],
  );
}

function Items({ className, ...props }: ComponentProps<"div">) {
  const { open } = useStack();
  const container = useRevealed(open);
  const hold = useHold(container);
  const { entries, files } = useVault();
  const roadmap = useRoadmap();
  const filePrefix = `${PATHS.files}/`;

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div
        ref={container}
        className={cn("reference-pages px-5 pb-[50vh]", className)}
        {...props}
      >
        <HoldHeightContext.Provider value={hold}>
          {open.map((id) => {
            const entry = entries.find((e) => e.id === id);
            if (entry) return <Item key={id} entry={entry} />;
            if (id.startsWith(ITEM_PREFIX)) {
              const index = Number(id.slice(ITEM_PREFIX.length));
              const voortgang = roadmap.items.find(
                (v) => v.item.index === index,
              );
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
        </HoldHeightContext.Provider>
      </div>
    </ScrollArea>
  );
}

export const ReferenceStack = { Root, Header, Items, Item, FileItem };
