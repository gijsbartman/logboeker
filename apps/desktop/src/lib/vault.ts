import { parseConfig } from "@logboeker/core";
import { loadVault, PATHS } from "@logboeker/vault";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useRouteContext, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { folderName, type VaultSource } from "./vaults";

export const vaultQuery = (source: VaultSource) =>
  queryOptions({
    queryKey: ["vault", source.root],
    queryFn: () => loadVault(source.fs),
    staleTime: Infinity,
  });

export const vaultNameQuery = (source: VaultSource) =>
  queryOptions({
    queryKey: ["vault-name", source.root],
    queryFn: async () => {
      try {
        const config = await source.fs.readText(PATHS.config);
        return (config && parseConfig(config).projectnaam) || folderName(source.root);
      } catch {
        return folderName(source.root);
      }
    },
    staleTime: Infinity,
  });

export function useVaultRegistry() {
  return useRouteContext({ from: "__root__" }).registry;
}

export function useVaultSource() {
  return useRouteContext({ from: "/_vault" }).source;
}

export function useVault() {
  return useSuspenseQuery(vaultQuery(useVaultSource())).data;
}

export function useSwitchVault() {
  const router = useRouter();
  const navigate = useNavigate();

  return async (change: () => Promise<void>) => {
    await change();
    await router.invalidate();
    await navigate({ to: "/", search: {} });
  };
}

export function useVaultWatcher(source: VaultSource) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    source.fs
      .watch?.(() => queryClient.invalidateQueries({ queryKey: vaultQuery(source).queryKey }))
      .then((unwatch) => (cancelled ? unwatch() : (stop = unwatch)));

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [source, queryClient]);
}
