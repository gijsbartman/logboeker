import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { expect, test } from "vitest";
import { createMemoryFs, loadVault } from "../src";

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
