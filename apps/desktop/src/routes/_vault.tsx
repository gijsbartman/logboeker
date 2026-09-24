import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useSwitchVault, useVaultWatcher, vaultQuery } from "@/lib/vault";
import { activateVault, folderName, removeVault } from "@/lib/vaults";

export const Route = createFileRoute("/_vault")({
  beforeLoad: ({ context }) => {
    if (!context.registry.active) throw redirect({ to: "/welkom" });
    return { source: context.registry.active };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(vaultQuery(context.source)),
  component: VaultLayout,
  errorComponent: VaultError,
});

function VaultLayout() {
  useVaultWatcher(Route.useRouteContext().source);
  return <Outlet />;
}

function VaultError({ error }: { error: unknown }) {
  const { source, registry } = Route.useRouteContext();
  const switchVault = useSwitchVault();
  const others = registry.vaults.filter((root) => root !== source.root);

  return (
    <main className="grid h-svh place-items-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-lg font-semibold">{folderName(source.root)} kon niet worden geladen</h1>
        <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
        {registry.managed && (
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => switchVault(() => removeVault(source.root))}>
              Uit lijst verwijderen
            </Button>
            {others.map((root) => (
              <Button key={root} variant="outline" onClick={() => switchVault(() => activateVault(root))}>
                Naar {folderName(root)}
              </Button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
