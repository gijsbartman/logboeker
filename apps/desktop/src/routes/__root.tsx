import type { VaultFs } from "@logboeker/vault";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { vaultQuery } from "@/lib/vault";

export type RouterContext = {
  queryClient: QueryClient;
  fs: VaultFs;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  loader: ({ context }) => context.queryClient.ensureQueryData(vaultQuery(context.fs)),
  component: Outlet,
  errorComponent: ({ error }) => (
    <main className="grid h-svh place-items-center p-6">
      <div className="max-w-md space-y-2 text-center">
        <h1 className="text-lg font-semibold">De vault kon niet worden geladen</h1>
        <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
      </div>
    </main>
  ),
});
