import type { WritableVaultFs } from "@logboeker/vault";
import { isTauri } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";
import { createTauriFs } from "./tauri-fs";

export type VaultSource = {
  root: string;
  fs: WritableVaultFs;
};

export type VaultRegistry = {
  vaults: string[];
  active: VaultSource | null;
  managed: boolean;
  sourceFor(root: string): VaultSource;
};

const STORE = "settings.json";
const KEYS = { vaults: "vaults", active: "activeVault" } as const;

async function readRegistry(): Promise<VaultRegistry> {
  if (!isTauri()) {
    if (!import.meta.env.DEV) throw new Error("Logboeker draait alleen als desktop-app");
    const { demoFs } = await import("./demo-fs");
    const demo = { root: "demo", fs: demoFs };
    return { vaults: [demo.root], active: demo, managed: false, sourceFor: () => demo };
  }

  const store = await load(STORE);
  const vaults = (await store.get<string[]>(KEYS.vaults)) ?? [];
  const active = (await store.get<string>(KEYS.active)) ?? null;
  const sourceFor = (root: string) => ({ root, fs: createTauriFs(root) });

  return {
    vaults,
    active: active && vaults.includes(active) ? sourceFor(active) : null,
    managed: true,
    sourceFor,
  };
}

let current: Promise<VaultRegistry> | undefined;

export function vaultRegistry() {
  return (current ??= readRegistry());
}

type RegistryState = { vaults: string[]; active: string | null };

async function update(change: (state: RegistryState) => RegistryState) {
  const store = await load(STORE);
  const next = change({
    vaults: (await store.get<string[]>(KEYS.vaults)) ?? [],
    active: (await store.get<string>(KEYS.active)) ?? null,
  });
  await store.set(KEYS.vaults, next.vaults);
  await store.set(KEYS.active, next.active);
  await store.save();
  current = undefined;
}

export const addVault = (root: string) =>
  update(({ vaults }) => ({ vaults: vaults.includes(root) ? vaults : [...vaults, root], active: root }));

export const activateVault = (root: string) => update(({ vaults }) => ({ vaults, active: root }));

export const removeVault = (root: string) =>
  update(({ vaults, active }) => {
    const rest = vaults.filter((v) => v !== root);
    return { vaults: rest, active: active === root ? (rest[0] ?? null) : active };
  });

export const folderName = (root: string) => root.split(/[\\/]/).pop() || root;
