import { Moon, RotateCcw, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VaultFileTree } from "@/features/files/file-tree";
import { FilterGroups } from "@/features/filters/filter-groups";
import { isFiltering } from "@/features/filters/search";
import { useFilters } from "@/features/filters/use-filters";
import { VaultSwitcher } from "@/features/vaults/vault-switcher";
import { useUiStore, type SidebarTab } from "@/lib/ui-store";
import { NotebookBrand } from "./notebook-brand";
import "./sidebar.css";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      className="notebook-theme-toggle"
      aria-label="Thema wisselen"
      title={dark ? "Licht thema" : "Donker thema"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}

export function AppSidebar() {
  const filters = useFilters();
  const { sidebarTab, setSidebarTab } = useUiStore();

  return (
    <Sidebar className="notebook-sidebar">
      <SidebarHeader className="notebook-sidebar-header">
        <NotebookBrand />
        <VaultSwitcher />
        <Tabs
          className="notebook-sidebar-tabs"
          value={sidebarTab}
          onValueChange={(tab) => setSidebarTab(tab as SidebarTab)}
        >
          <TabsList variant="line" className="notebook-sidebar-tab-list">
            <TabsTrigger value="filters">Filters</TabsTrigger>
            <TabsTrigger value="bestanden">Bestanden</TabsTrigger>
          </TabsList>
        </Tabs>
      </SidebarHeader>

      <SidebarContent
        className="notebook-sidebar-content"
        role="region"
        aria-label={sidebarTab === "filters" ? "Filters" : "Bestanden"}
      >
        {sidebarTab === "filters" ? <FilterGroups /> : <VaultFileTree />}
      </SidebarContent>

      <SidebarFooter className="notebook-sidebar-footer">
        {sidebarTab === "filters" && (
          <SidebarMenuButton
            className="notebook-filter-reset"
            disabled={!isFiltering(filters.search)}
            onClick={filters.reset}
          >
            <RotateCcw />
            Filters wissen
          </SidebarMenuButton>
        )}
        <div className="notebook-sidebar-colophon">
          <ThemeToggle />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
