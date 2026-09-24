import { beforeEach, expect, test, vi } from "vitest";
import { createTauriFs } from "@/lib/tauri-fs";

const disk = vi.hoisted(() => ({
  files: new Map<string, string>(),
  watcher: null as ((event: { paths: string[] }) => void) | null,
}));

vi.mock("@tauri-apps/api/core", () => ({ convertFileSrc: (path: string) => `asset://localhost${path}` }));
vi.mock("@tauri-apps/plugin-fs", () => ({
  exists: async (path: string) => [...disk.files.keys()].some((p) => p === path || p.startsWith(`${path}/`)),
  readTextFile: async (path: string) => disk.files.get(path)!,
  readDir: async (dir: string) =>
    [...disk.files.keys()]
      .filter((p) => p.startsWith(`${dir}/`))
      .map((p) => p.slice(dir.length + 1))
      .map((rest) => ({ name: rest.split("/")[0]!, isFile: !rest.includes("/") })),
  writeTextFile: async (path: string, contents: string) => void disk.files.set(path, contents),
  rename: async (from: string, to: string) => {
    disk.files.set(to, disk.files.get(from)!);
    disk.files.delete(from);
  },
  watch: async (_root: string, callback: (event: { paths: string[] }) => void) => {
    disk.watcher = callback;
    return () => (disk.watcher = null);
  },
}));

beforeEach(() => {
  disk.files = new Map([
    ["/vault/logboek/daily/2026-09-08.md", "# Dag"],
    ["/vault/logboek/daily/sub/nested.md", ""],
  ]);
});

const fs = createTauriFs("/vault");

test("paths are resolved against the vault root", async () => {
  expect(await fs.readText("logboek/daily/2026-09-08.md")).toBe("# Dag");
  expect(fs.fileUrl("logboek/files/a.pdf")).toBe("asset://localhost/vault/logboek/files/a.pdf");
});

test("list returns files only, and nothing for a missing folder", async () => {
  expect(await fs.list("logboek/daily")).toEqual(["2026-09-08.md"]);
  expect(await fs.list("logboek/evidence")).toEqual([]);
});

test("a missing file reads as null", async () => {
  expect(await fs.readText("data/config.md")).toBeNull();
});

test("changes inside .git do not trigger a reload", async () => {
  const onChange = vi.fn();
  await fs.watch!(onChange);

  disk.watcher!({ paths: ["/vault/.git/index"] });
  expect(onChange).not.toHaveBeenCalled();
  disk.watcher!({ paths: ["/vault/logboek/daily/2026-09-09.md"] });
  expect(onChange).toHaveBeenCalledOnce();
});

test("writes go through a temporary file that is renamed into place", async () => {
  await fs.writeText("logboek/daily/2026-09-08.md", "# Nieuw");
  expect(disk.files.get("/vault/logboek/daily/2026-09-08.md")).toBe("# Nieuw");
  expect([...disk.files.keys()].some((path) => path.endsWith(".tmp"))).toBe(false);
});
