import { workdays } from "@logboeker/core";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EntryList } from "@/features/entries/entry-list";
import { isFiltering, matchesFilters } from "@/features/filters/search";
import { useFilters } from "@/features/filters/use-filters";
import { useVault } from "@/lib/vault";

export const Route = createFileRoute("/_vault/_workspace/")({
  component: EntriesPage,
});

function EntriesPage() {
  const { entries, doelen, config } = useVault();
  const filters = useFilters();
  const { search } = filters;
  const shown = entries.filter((entry) => matchesFilters(entry, search));
  const days = new Set(entries.map((entry) => entry.date).filter(Boolean)).size;
  const totalDays = workdays(new Date().toLocaleDateString("sv-SE"), config);
  const evidence = entries.filter((entry) => entry.kind === "bewijs").length;
  const filtering = isFiltering(search);
  const title = config.projectnaam || "Persoonlijk logboek";

  return (
    <div className="journal-pane">
      <ScrollArea className="h-full">
        <div className="journal-page">
          <section className="journal-masthead" aria-labelledby="journal-title">
            <div className="journal-intro">
              <h1 id="journal-title">{title}</h1>
            </div>
            <dl className="journal-stats">
              <div>
                <dt>Dagen vastgelegd</dt>
                <dd>
                  {String(days).padStart(2, "0")}
                  {totalDays !== null && <small>/{totalDays}</small>}
                </dd>
              </div>
              <div>
                <dt>Bewijsstukken</dt>
                <dd>
                  {String(evidence).padStart(2, "0")}
                  <ArrowUpRight aria-hidden="true" />
                </dd>
              </div>
            </dl>
          </section>
          <div className="journal-toolbar">
            <div
              className="journal-views"
              role="group"
              aria-label="Entries tonen"
            >
              {(
                [
                  { label: "Alles", value: null },
                  { label: "Daglogs", value: "log" },
                  { label: "Bewijsstukken", value: "bewijs" },
                ] as const
              ).map(({ label, value }) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={
                    value === null
                      ? search.soort.length !== 1
                      : search.soort.length === 1 && search.soort[0] === value
                  }
                  onClick={() =>
                    filters.set("soort", value === null ? [] : [value])
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="journal-count" aria-live="polite" aria-atomic="true">
              {filtering
                ? `${shown.length} van ${entries.length}`
                : `${entries.length} entries`}
            </p>
          </div>
          <div className="journal-list-caption">
            <span>
              <ArrowDown className="size-3" aria-hidden="true" />{" "}
              {search.groep === "doel"
                ? "Gegroepeerd op doel"
                : "Nieuwste eerst"}
            </span>
            {filtering && (
              <Button
                variant="ghost"
                size="xs"
                onClick={filters.reset}
                aria-label="Alle filters wissen"
              >
                Filters actief <X />
              </Button>
            )}
          </div>
          <EntryList entries={shown} total={entries.length} doelen={doelen} />
          <footer className="journal-colophon">
            <span>logboeker</span>
          </footer>
        </div>
      </ScrollArea>
    </div>
  );
}
