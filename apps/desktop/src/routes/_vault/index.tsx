import { workdays } from "@logboeker/core";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, BookOpen, X } from "lucide-react";
import { type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { EntryList } from "@/features/entries/entry-list";
import { AppSidebar } from "@/features/layout/app-sidebar";
import {
  DEFAULT_SEARCH,
  isFiltering,
  matchesFilters,
  searchSchema,
} from "@/features/filters/search";
import { useFilters } from "@/features/filters/use-filters";
import { useIsMobile } from "@/hooks/use-mobile";
import { ReferenceStack } from "@/features/references/reference-stack";
import { SearchCommand } from "@/features/search/search-command";
import { useVault } from "@/lib/vault";

export const Route = createFileRoute("/_vault/")({
  validateSearch: searchSchema,
  search: { middlewares: [stripSearchParams(DEFAULT_SEARCH)] },
  component: EntriesPage,
});

function EntriesPage() {
  const { entries, doelen, config } = useVault();
  const search = Route.useSearch();
  const filters = useFilters();
  const stackReferences = useIsMobile(1100);
  const shown = entries.filter((entry) => matchesFilters(entry, search));
  const days = new Set(entries.map((entry) => entry.date).filter(Boolean)).size;
  const totalDays = workdays(new Date().toLocaleDateString("sv-SE"), config);
  const evidence = entries.filter((entry) => entry.kind === "bewijs").length;
  const filtering = isFiltering(search);
  const title = config.projectnaam || "Persoonlijk logboek";

  return (
    <SidebarProvider style={{ "--sidebar-width": "17rem" } as CSSProperties}>
      <AppSidebar />
      <SidebarInset className="h-svh min-w-0 overflow-hidden">
        <header className="workspace-bar">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger aria-label="Zijbalk wisselen" />
            <span className="workspace-divider" />
            <BookOpen
              className="size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="truncate text-xs">{title}</span>
          </div>
          <SearchCommand />
        </header>
        <ResizablePanelGroup
          orientation={stackReferences ? "vertical" : "horizontal"}
          className="min-h-0 flex-1"
        >
          <ResizablePanel id="entries" minSize="40%">
            <div className="journal-pane">
              <ScrollArea className="h-full">
                <div className="journal-page">
                  <section
                    className="journal-masthead"
                    aria-labelledby="journal-title"
                  >
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
                              : search.soort.length === 1 &&
                                search.soort[0] === value
                          }
                          onClick={() =>
                            filters.set("soort", value === null ? [] : [value])
                          }
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <p
                      className="journal-count"
                      aria-live="polite"
                      aria-atomic="true"
                    >
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
                  <EntryList
                    entries={shown}
                    total={entries.length}
                    doelen={doelen}
                  />
                  <footer className="journal-colophon">
                    <span>logboeker</span>
                  </footer>
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>
          {search.open.length > 0 && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel id="references" defaultSize="38%" minSize="25%">
                <ReferenceStack.Root>
                  <ReferenceStack.Header />
                  <ReferenceStack.Items />
                </ReferenceStack.Root>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </SidebarInset>
    </SidebarProvider>
  );
}
