import type { Entry as EntryModel } from "@logboeker/core";
import { NotebookPen, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useFilters } from "@/features/filters/use-filters";
import { formatDate, humanise } from "@/lib/format";
import { Entry } from "./entry";
import { groupByDate, groupByDoel, type EntryGroup } from "./group-entries";

function EntryCard({ entry }: { entry: EntryModel }) {
  return (
    <Entry.Root entry={entry}>
      <Entry.Header>
        <Entry.Title />
        <Entry.Meta />
        <Entry.Actions>
          <Entry.EditButton />
          <Entry.Kind />
        </Entry.Actions>
      </Entry.Header>
      <Entry.Body />
      <Entry.Attachments />
      <Entry.Tags />
    </Entry.Root>
  );
}

function DateGroups({ entries }: { entries: EntryModel[] }) {
  return groupByDate(entries).map((group) => (
    <section key={group.key} className="space-y-3">
      <h3 className="sticky top-0 z-10 bg-background/90 py-2 text-sm font-medium text-muted-foreground backdrop-blur first-letter:uppercase">
        {formatDate(group.label)}
      </h3>
      {group.entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
    </section>
  ));
}

function DoelGroup({ group }: { group: EntryGroup }) {
  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 border-b pb-2 text-lg font-semibold">
        {group.label ? humanise(group.label) : "Zonder doel"}
        <Badge variant="secondary">{group.entries.length}</Badge>
      </h2>
      <DateGroups entries={group.entries} />
    </section>
  );
}

type EntryListProps = { entries: EntryModel[]; total: number; doelen: string[] };

export function EntryList({ entries, total, doelen }: EntryListProps) {
  const { search, reset } = useFilters();

  if (total === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <NotebookPen />
          </EmptyMedia>
          <EmptyTitle>Nog geen entries</EmptyTitle>
          <EmptyDescription>
            Dit logboek is nog leeg. Entries in <code>logboek/daily</code> en <code>logboek/evidence</code> verschijnen
            hier vanzelf.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (entries.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX />
          </EmptyMedia>
          <EmptyTitle>Niets gevonden</EmptyTitle>
          <EmptyDescription>Geen entries die bij deze filters passen.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={reset}>
            Filters wissen
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="space-y-8">
      {search.groep === "doel" ? (
        groupByDoel(entries, doelen, search.doel).map((group) => <DoelGroup key={group.key} group={group} />)
      ) : (
        <DateGroups entries={entries} />
      )}
    </div>
  );
}
