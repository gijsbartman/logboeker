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

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <Button variant="ghost" size="icon" aria-label="Thema wisselen" onClick={() => setTheme(dark ? "light" : "dark")}>
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}

export function AppSidebar() {
  const filters = useFilters();
  const { sidebarTab, setSidebarTab } = useUiStore();

  return (
    <Sidebar>
      <SidebarHeader className="gap-3">
        <VaultSwitcher />
        <Tabs value={sidebarTab} onValueChange={(tab) => setSidebarTab(tab as SidebarTab)}>
          <TabsList className="w-full">
            <TabsTrigger value="filters">Filters</TabsTrigger>
            <TabsTrigger value="bestanden">Bestanden</TabsTrigger>
          </TabsList>
        </Tabs>
      </SidebarHeader>

      <SidebarContent role="region" aria-label={sidebarTab === "filters" ? "Filters" : "Bestanden"}>
        {sidebarTab === "filters" ? <FilterGroups /> : <VaultFileTree />}
      </SidebarContent>

      <SidebarFooter className="flex-row items-center">
        {sidebarTab === "filters" && (
          <SidebarMenuButton disabled={!isFiltering(filters.search)} onClick={filters.reset}>
            <RotateCcw />
            Filters wissen
          </SidebarMenuButton>
        )}
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
