import type { WritableVaultFs } from "@logboeker/vault";
import { convertFileSrc } from "@tauri-apps/api/core";
import { openPath } from "@tauri-apps/plugin-opener";
import { exists, mkdir, readDir, readTextFile, rename, watch, writeTextFile } from "@tauri-apps/plugin-fs";

const IGNORED = /[\\/](\.git|\.DS_Store)([\\/]|$)/;

export function createTauriFs(root: string): WritableVaultFs {
  const at = (path: string) => `${root}/${path}`;

  return {
    async list(dir) {
      if (!(await exists(at(dir)))) return [];
      return (await readDir(at(dir))).filter((entry) => entry.isFile).map((entry) => entry.name);
    },
    exists: (path) => exists(at(path)),
    async readText(path) {
      return (await exists(at(path))) ? readTextFile(at(path)) : null;
    },
    fileUrl: (path) => convertFileSrc(at(path)),
    open: (path) => openPath(at(path)),
    mkdir: (dir) => mkdir(at(dir), { recursive: true }),
    async writeText(path, contents) {
      const temp = `${at(path)}.tmp`;
      await writeTextFile(temp, contents);
      await rename(temp, at(path));
    },
    watch: (onChange) =>
      watch(
        root,
        (event) => {
          if (event.paths.some((path) => !IGNORED.test(path))) onChange();
        },
        { recursive: true, delayMs: 300 },
      ),
  };
}
