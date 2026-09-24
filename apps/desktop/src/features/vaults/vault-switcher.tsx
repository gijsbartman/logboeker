import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BookOpen, ChevronsUpDown, FolderMinus, Plus, Settings } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useSwitchVault, useVaultRegistry, useVaultSource, vaultNameQuery } from "@/lib/vault";
import { activateVault, folderName, removeVault } from "@/lib/vaults";
import { AddVaultDialog } from "./add-vault-dialog";

function VaultName({ root }: { root: string }) {
  const registry = useVaultRegistry();
  const { data } = useQuery(vaultNameQuery(registry.sourceFor(root)));
  return <>{data ?? folderName(root)}</>;
}

export function VaultSwitcher() {
  const registry = useVaultRegistry();
  const source = useVaultSource();
  const switchVault = useSwitchVault();
  const [adding, setAdding] = useState(false);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <BookOpen className="size-4" />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-medium">
                  <VaultName root={source.root} />
                </span>
                <span className="truncate text-xs text-muted-foreground">{folderName(source.root)}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Logboeken</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={source.root}
              onValueChange={(root) => switchVault(() => activateVault(root))}
            >
              {registry.vaults.map((root) => (
                <DropdownMenuRadioItem key={root} value={root} disabled={!registry.managed} title={root}>
                  <VaultName root={root} />
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            {registry.managed && (
              <DropdownMenuItem onSelect={() => setAdding(true)}>
                <Plus />
                Logboek toevoegen…
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link to="/instellingen">
                <Settings />
                Instellingen
              </Link>
            </DropdownMenuItem>
            {registry.managed && (
              <DropdownMenuItem onSelect={() => switchVault(() => removeVault(source.root))}>
                <FolderMinus />
                Uit lijst verwijderen
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <AddVaultDialog open={adding} onOpenChange={setAdding} />
    </SidebarMenu>
  );
}
