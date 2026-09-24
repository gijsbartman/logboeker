import { loadVault, type VaultFs } from "@logboeker/vault";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";

export const vaultQuery = (fs: VaultFs) =>
  queryOptions({
    queryKey: ["vault"],
    queryFn: () => loadVault(fs),
    staleTime: Infinity,
  });

export function useVault() {
  const { fs } = useRouteContext({ from: "__root__" });
  return useSuspenseQuery(vaultQuery(fs)).data;
}
