import {
  createFileRoute,
  Link,
  Outlet,
  stripSearchParams,
} from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { type CSSProperties } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DEFAULT_SEARCH, searchSchema } from "@/features/filters/search";
import { AppSidebar } from "@/features/layout/app-sidebar";
import { ReferenceStack } from "@/features/references/reference-stack";
import { SearchCommand } from "@/features/search/search-command";
import { useIsMobile } from "@/hooks/use-mobile";
import { useVault } from "@/lib/vault";

export const Route = createFileRoute("/_vault/_workspace")({
  validateSearch: searchSchema,
  search: { middlewares: [stripSearchParams(DEFAULT_SEARCH)] },
  component: Workspace,
});

const VIEWS = [
  { to: "/", label: "Lijst" },
  { to: "/kalender", label: "Kalender" },
] as const;

function Workspace() {
  const { config } = useVault();
  const { open } = Route.useSearch();
  const stackReferences = useIsMobile(1100);
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
          <div className="flex items-center gap-5">
            <nav className="workspace-views" aria-label="Weergave">
              {VIEWS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  search={(prev) => prev}
                  activeOptions={{ exact: true, includeSearch: false }}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <SearchCommand />
          </div>
        </header>
        <ResizablePanelGroup
          orientation={stackReferences ? "vertical" : "horizontal"}
          className="min-h-0 flex-1"
        >
          <ResizablePanel id="entries" minSize="40%">
            <Outlet />
          </ResizablePanel>
          {open.length > 0 && (
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
