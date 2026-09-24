import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseConfig, parseEntry, parseRoadmap, type Entry, type Roadmap } from "../src";

const VAULT = join(import.meta.dirname, "../../../fixtures/vault");

export const config = parseConfig(readFileSync(join(VAULT, "data/config.md"), "utf8"));

export function loadEntries(): Entry[] {
  return ["logboek/daily", "logboek/evidence"].flatMap((dir) =>
    readdirSync(join(VAULT, dir))
      .filter((name) => name.endsWith(".md"))
      .map((name) => parseEntry(`${dir}/${name}`, readFileSync(join(VAULT, dir, name), "utf8"), config).entry),
  );
}

export function fixtureFiles(): Set<string> {
  return new Set(readdirSync(join(VAULT, "logboek/files")));
}

export function entry(id: string): Entry {
  const found = loadEntries().find((e) => e.id === id);
  if (!found) throw new Error(`No fixture ${id}`);
  return found;
}

export function readRoadmapSource(): string {
  return readFileSync(join(VAULT, "logboek/roadmap.md"), "utf8");
}

export function readRoadmap(): Roadmap {
  return parseRoadmap(readRoadmapSource(), config);
}
