import type { Entry as EntryModel } from "@logboeker/core";
import { NotebookPen, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useFilters } from "@/features/filters/use-filters";
import { formatDate, humanise } from "@/lib/format";
import { Entry } from "./entry";
import { groupByDate, groupByDoel, type EntryGroup } from "./group-entries";

function JournalEntry({ entry }: { entry: EntryModel }) {
  return (
    <Entry.Root entry={entry}>
      <Entry.Header>
        <Entry.Title />
        <Entry.Meta showDate={false} />
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
    <section key={group.key} className="journal-day">
      <h3 className="journal-date" aria-label={formatDate(group.label)}>
        {group.label ? (
          <time dateTime={group.label}>
            <span className="journal-date-number">
              {group.label.slice(8, 10)}
            </span>
            <span className="journal-date-month">
              {new Date(`${group.label}T00:00:00`).toLocaleDateString("nl-NL", {
                month: "short",
              })}{" "}
              {group.label.slice(0, 4)}
            </span>
            <span className="journal-date-weekday">
              {new Date(`${group.label}T00:00:00`).toLocaleDateString("nl-NL", {
                weekday: "long",
              })}
            </span>
          </time>
        ) : (
          <span className="text-xs">Zonder datum</span>
        )}
      </h3>
      <div className="journal-day-entries">
        {group.entries.map((entry) => (
          <JournalEntry key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  ));
}

function DoelGroup({ group }: { group: EntryGroup }) {
  return (
    <section className="journal-goal">
      <h2 className="journal-goal-heading">
        {group.label ? humanise(group.label) : "Zonder doel"}
        <span>{group.entries.length}</span>
      </h2>
      <DateGroups entries={group.entries} />
    </section>
  );
}

type EntryListProps = {
  entries: EntryModel[];
  total: number;
  doelen: string[];
};

export function EntryList({ entries, total, doelen }: EntryListProps) {
  const { search, reset } = useFilters();

  if (total === 0) {
    return (
      <Empty className="journal-empty">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <NotebookPen />
          </EmptyMedia>
          <EmptyTitle>Nog geen entries</EmptyTitle>
          <EmptyDescription>
            Dit logboek is nog leeg. Entries in <code>logboek/daily</code> en{" "}
            <code>logboek/evidence</code> verschijnen hier vanzelf.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (entries.length === 0) {
    return (
      <Empty className="journal-empty">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX />
          </EmptyMedia>
          <EmptyTitle>Niets gevonden</EmptyTitle>
          <EmptyDescription>
            Geen entries die bij deze filters passen.
          </EmptyDescription>
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
    <div className="journal-entries">
      {search.groep === "doel" ? (
        groupByDoel(entries, doelen, search.doel).map((group) => (
          <DoelGroup key={group.key} group={group} />
        ))
      ) : (
        <DateGroups entries={entries} />
      )}
    </div>
  );
}
