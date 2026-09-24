import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { expect, test } from "vitest";
import { ConflictError, createMemoryFs, loadVault, missingVaultPaths, saveSource, scaffoldVault } from "../src";

const ROOT = join(import.meta.dirname, "../../../fixtures/vault");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [relative(ROOT, path)];
  });
}

function fixtureFs() {
  const texts: Record<string, string> = {};
  const urls: Record<string, string> = {};
  for (const path of walk(ROOT)) {
    if (path.startsWith("logboek/files/")) urls[path] = `memory://${path}`;
    else texts[path] = readFileSync(join(ROOT, path), "utf8");
  }
  return createMemoryFs(texts, urls);
}

test("loads entries newest first", async () => {
  const vault = await loadVault(fixtureFs());
  expect(vault.entries.map((e) => e.id)).toEqual([
    "logboek/daily/2026-09-15",
    "logboek/evidence/2026-09-12-sprintreview",
    "logboek/evidence/2026-09-09-adr-tokenlaag",
    "logboek/daily/2026-09-09",
    "logboek/daily/2026-09-08",
  ]);
});

test("goals are ordered by how often they occur", async () => {
  const vault = await loadVault(
    createMemoryFs({
      "data/config.md": "---\n---\n",
      "logboek/daily/2026-09-01.md": "---\ndoelen: [b, a]\n---\n",
      "logboek/daily/2026-09-02.md": "---\ndoelen: [b]\n---\n",
    }),
  );
  expect(vault.doelen).toEqual(["b", "a"]);
});

test("criteria, files and diagnostics come with the snapshot", async () => {
  const vault = await loadVault(fixtureFs());
  expect(vault.criteria.samenwerken?.levels[3]?.subtitle).toBeTruthy();
  expect(vault.files).toEqual(["2026-09-12-sprintreview.pptx"]);
  expect(vault.fileUrl("2026-09-12-sprintreview.pptx")).toBe("memory://logboek/files/2026-09-12-sprintreview.pptx");
  expect(vault.fileUrl("missing.pdf")).toBeNull();
  expect(vault.diagnostics.map((d) => d.code)).toContain("missing-attachment");
});

test("a vault without config is rejected", async () => {
  await expect(loadVault(createMemoryFs({}))).rejects.toThrow("data/config.md");
});

test("search includes text extracted from attachments", async () => {
  const vault = await loadVault(
    createMemoryFs({
      "data/config.md": "---\n---\n",
      "logboek/evidence/2026-09-12-deck.md": "---\nbestanden: [deck.pptx]\n---\n# Deck\n",
      "logboek/files/deck.pptx": "",
      "logboek/files/.extracted/deck.pptx.txt": "stakeholderanalyse",
    }),
  );
  expect(vault.search.search("stakeholder").map((hit) => hit.entry.id)).toEqual(["logboek/evidence/2026-09-12-deck"]);
});

test("an existing vault has nothing missing", async () => {
  expect(await missingVaultPaths(fixtureFs())).toEqual([]);
});

test("an arbitrary folder reports what a vault needs", async () => {
  const fs = createMemoryFs({ "notes.md": "" });
  expect(await missingVaultPaths(fs)).toEqual(["data/config.md", "logboek/daily", "logboek/evidence"]);
});

test("scaffolding creates a vault that loads", async () => {
  const fs = createMemoryFs({});
  await scaffoldVault(fs, { student_naam: "Gijs", projectnaam: "X", semesterstart: "2026-09-07", sprintlengte_weken: 3 });

  expect(await missingVaultPaths(fs)).toEqual([]);
  expect(await fs.readText("data/config.md")).toMatch(/^---\nstudent_naam: Gijs\n.*sprintlengte_weken: 3\n---\n\n# Configuratie/s);
  const vault = await loadVault(fs);
  expect(vault.config).toMatchObject({ projectnaam: "X", semesterstart: "2026-09-07", sprintlengte_weken: 3 });
  expect(vault.entries).toEqual([]);
});

test("scaffolding refuses to overwrite a vault", async () => {
  await expect(scaffoldVault(fixtureFs(), { sprintlengte_weken: 2 })).rejects.toThrow("al een logboek");
});

test("scaffolding rejects an invalid config", async () => {
  await expect(scaffoldVault(createMemoryFs({}), { semesterstart: "7-9-2026", sprintlengte_weken: 2 })).rejects.toThrow();
});

test("hidden files are not attachments, and an unreadable cache does not block loading", async () => {
  const base = createMemoryFs({
    "data/config.md": "---\n---\n",
    "logboek/files/.gitkeep": "",
    "logboek/files/.DS_Store": "",
    "logboek/files/deck.pptx": "",
  });
  const fs = {
    ...base,
    readText: async (path: string) => {
      if (path.includes(".extracted/")) throw new Error("forbidden path");
      return base.readText(path);
    },
  };

  const vault = await loadVault(fs);
  expect(vault.files).toEqual(["deck.pptx"]);
});

test("saving writes when the file is unchanged since it was read", async () => {
  const fs = createMemoryFs({ "logboek/daily/a.md": "old" });
  await saveSource(fs, "logboek/daily/a.md", "new", "old");
  expect(await fs.readText("logboek/daily/a.md")).toBe("new");
});

test("saving refuses when the file changed on disk, and returns what is there now", async () => {
  const fs = createMemoryFs({ "logboek/daily/a.md": "written by a skill" });
  const error = await saveSource(fs, "logboek/daily/a.md", "mine", "old").catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ConflictError);
  expect((error as ConflictError).current).toBe("written by a skill");
  expect(await fs.readText("logboek/daily/a.md")).toBe("written by a skill");
});
