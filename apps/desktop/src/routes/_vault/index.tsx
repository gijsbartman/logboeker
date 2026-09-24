import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { EntryList } from "@/features/entries/entry-list";
import { AppSidebar } from "@/features/layout/app-sidebar";
import { DEFAULT_SEARCH, isFiltering, matchesFilters, searchSchema } from "@/features/filters/search";
import { ReferenceStack } from "@/features/references/reference-stack";
import { SearchCommand } from "@/features/search/search-command";
import { useVault } from "@/lib/vault";

export const Route = createFileRoute("/_vault/")({
  validateSearch: searchSchema,
  search: { middlewares: [stripSearchParams(DEFAULT_SEARCH)] },
  component: EntriesPage,
});

function EntriesPage() {
  const { entries, doelen } = useVault();
  const search = Route.useSearch();
  const shown = entries.filter((entry) => matchesFilters(entry, search));

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-svh overflow-hidden">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel id="entries" minSize="40%">
            <ScrollArea className="h-full">
              <header className="flex items-center gap-2 border-b px-4 py-2">
                <SidebarTrigger />
                <p className="text-sm text-muted-foreground">
                  {isFiltering(search) ? `${shown.length} van ${entries.length}` : `${entries.length} entries`}
                </p>
                <div className="ml-auto">
                  <SearchCommand />
                </div>
              </header>
              <main className="mx-auto max-w-3xl p-6">
                <EntryList entries={shown} total={entries.length} doelen={doelen} />
              </main>
            </ScrollArea>
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
