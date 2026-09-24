import { missingVaultPaths, scaffoldVault, type NewVaultConfig } from "@logboeker/vault";
import { useMutation } from "@tanstack/react-query";
import { open } from "@tauri-apps/plugin-dialog";
import { useSwitchVault } from "@/lib/vault";
import { addVault } from "@/lib/vaults";
import { createTauriFs } from "@/lib/tauri-fs";

export class InvalidVaultError extends Error {
  constructor(readonly missing: string[]) {
    super(`Deze map is geen logboek. Er ontbreekt: ${missing.join(", ")}`);
  }
}

async function pickFolder(title: string): Promise<string | null> {
  const path = await open({ directory: true, recursive: true, canCreateDirectories: true, title });
  return typeof path === "string" ? path : null;
}

function useAddAfter<T>(action: (input: T) => Promise<string | null>, onAdded?: () => void) {
  const switchVault = useSwitchVault();
  return useMutation({
    mutationFn: action,
    onSuccess: async (root) => {
      if (!root) return;
      onAdded?.();
      await switchVault(() => addVault(root));
    },
  });
}

export function useOpenVault(onAdded?: () => void) {
  return useAddAfter(async () => {
    const root = await pickFolder("Logboek openen");
    if (!root) return null;
    const missing = await missingVaultPaths(createTauriFs(root));
    if (missing.length > 0) throw new InvalidVaultError(missing);
    return root;
  }, onAdded);
}

export function useCreateVault(onAdded?: () => void) {
  return useAddAfter(async (config: NewVaultConfig) => {
    const root = await pickFolder("Map voor het nieuwe logboek");
    if (!root) return null;
    await scaffoldVault(createTauriFs(root), config);
    return root;
  }, onAdded);
}
