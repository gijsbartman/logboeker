import type { WritableVaultFs } from "@logboeker/vault";
import { vi } from "vitest";

export const vaultState = {
  vaults: [] as string[],
  active: null as string | null,
  disks: new Map<string, WritableVaultFs>(),
  picked: null as string | null,
  reset() {
    this.vaults = [];
    this.active = null;
    this.disks.clear();
    this.picked = null;
  },
};

vi.mock("@/lib/vaults", () => {
  const state = vaultState;
  const sourceFor = (root: string) => ({ root, fs: state.disks.get(root)! });
  return {
    vaultRegistry: async () => ({
      vaults: [...state.vaults],
      active: state.active ? sourceFor(state.active) : null,
      managed: true,
      sourceFor,
    }),
    addVault: async (root: string) => {
      if (!state.vaults.includes(root)) state.vaults.push(root);
      state.active = root;
    },
    activateVault: async (root: string) => {
      state.active = root;
    },
    removeVault: async (root: string) => {
      state.vaults = state.vaults.filter((v) => v !== root);
      if (state.active === root) state.active = state.vaults[0] ?? null;
    },
    folderName: (root: string) => root.split("/").pop(),
  };
});
vi.mock("@/lib/tauri-fs", () => ({ createTauriFs: (root: string) => vaultState.disks.get(root) }));
vi.mock("@tauri-apps/plugin-dialog", () => ({ open: async () => vaultState.picked }));
