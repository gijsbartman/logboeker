import {
  createResolver,
  createSearchIndex,
  ENTRY_DIRS,
  parseConfig,
  parseCriteria,
  parseEntry,
  validateEntry,
  type Config,
  type CriteriaBook,
  type Diagnostic,
  type Entry,
  type Resolver,
  type SearchIndex,
} from "@logboeker/core";

export const PATHS = {
  config: "data/config.md",
  criteria: "data/json/vaardigheden.json",
  files: "logboek/files",
  extracted: "logboek/files/.extracted",
} as const;

export interface VaultFs {
  list(dir: string): Promise<string[]>;
  readText(path: string): Promise<string | null>;
  fileUrl(path: string): string | null;
}

export interface Vault {
  config: Config;
  entries: Entry[];
  resolver: Resolver;
  search: SearchIndex;
  criteria: CriteriaBook;
  files: string[];
  doelen: string[];
  diagnostics: Diagnostic[];
  fileUrl(name: string): string | null;
}

function byFrequency(values: string[]): string[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort(([a, x], [b, y]) => y - x || a.localeCompare(b)).map(([value]) => value);
}

async function readEntries(fs: VaultFs, config: Config): Promise<Entry[]> {
  const paths = (
    await Promise.all(
      Object.values(ENTRY_DIRS).map(async (dir) =>
        (await fs.list(dir)).filter((name) => name.endsWith(".md")).map((name) => `${dir}/${name}`),
      ),
    )
  ).flat();

  const entries = await Promise.all(
    paths.map(async (path) => parseEntry(path, (await fs.readText(path)) ?? "", config).entry),
  );
  return entries.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || b.id.localeCompare(a.id));
}

export async function loadVault(fs: VaultFs): Promise<Vault> {
  const configSource = await fs.readText(PATHS.config);
  if (configSource === null) throw new Error(`${PATHS.config} is missing`);
  const config = parseConfig(configSource);

  const [entries, criteriaSource, files] = await Promise.all([
    readEntries(fs, config),
    fs.readText(PATHS.criteria),
    fs.list(PATHS.files),
  ]);

  const extracted = new Map(
    await Promise.all(
      files.map(async (name) => [name, (await fs.readText(`${PATHS.extracted}/${name}.txt`)) ?? ""] as const),
    ),
  );

  const resolver = createResolver(entries);
  const doelen = byFrequency(entries.flatMap((e) => e.doelen));
  const fileSet = new Set(files);
  const diagnostics = entries.flatMap((entry) => validateEntry(entry, { resolver, files: fileSet, doelen }));

  return {
    config,
    entries,
    resolver,
    search: createSearchIndex(entries, (name) => extracted.get(name) ?? ""),
    criteria: criteriaSource ? parseCriteria(JSON.parse(criteriaSource)) : {},
    files,
    doelen,
    diagnostics,
    fileUrl: (name) => (fileSet.has(name) ? fs.fileUrl(`${PATHS.files}/${name}`) : null),
  };
}

export function createMemoryFs(texts: Record<string, string>, urls: Record<string, string> = {}): VaultFs {
  const paths = [...Object.keys(texts), ...Object.keys(urls)];
  return {
    async list(dir) {
      const prefix = `${dir}/`;
      return [...new Set(paths.filter((p) => p.startsWith(prefix) && !p.slice(prefix.length).includes("/")))].map(
        (p) => p.slice(prefix.length),
      );
    },
    async readText(path) {
      return texts[path] ?? null;
    },
    fileUrl(path) {
      return urls[path] ?? null;
    },
  };
}
