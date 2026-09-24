import {
  configSchema,
  createResolver,
  createSearchIndex,
  editRoadmap,
  EMPTY_ROADMAP,
  ENTRY_DIRS,
  parseConfig,
  parseCriteria,
  parseEntry,
  parseRoadmap,
  ROADMAP_TEMPLATE,
  updateFrontmatter,
  validateEntry,
  validateRoadmap,
  type Config,
  type CriteriaBook,
  type Diagnostic,
  type Entry,
  type Resolver,
  type Roadmap,
  type RoadmapEdit,
  type SearchIndex,
} from "@logboeker/core";

export const PATHS = {
  config: "data/config.md",
  criteria: "data/json/vaardigheden.json",
  roadmap: "logboek/roadmap.md",
  files: "logboek/files",
  extracted: "logboek/files/.extracted",
} as const;

export const REQUIRED_PATHS = [PATHS.config, ENTRY_DIRS.log, ENTRY_DIRS.bewijs] as const;

export interface VaultFs {
  list(dir: string): Promise<string[]>;
  exists(path: string): Promise<boolean>;
  readText(path: string): Promise<string | null>;
  fileUrl(path: string): string | null;
  open?(path: string): Promise<void>;
  watch?(onChange: () => void): Promise<() => void>;
}

export interface WritableVaultFs extends VaultFs {
  mkdir(dir: string): Promise<void>;
  writeText(path: string, contents: string): Promise<void>;
}

export interface Vault {
  config: Config;
  entries: Entry[];
  resolver: Resolver;
  search: SearchIndex;
  criteria: CriteriaBook;
  roadmap: Roadmap;
  files: string[];
  doelen: string[];
  diagnostics: Diagnostic[];
  fileUrl(name: string): string | null;
  openFile(name: string): Promise<void>;
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

  const [entries, criteriaSource, roadmapSource, listed] = await Promise.all([
    readEntries(fs, config),
    fs.readText(PATHS.criteria),
    fs.readText(PATHS.roadmap),
    fs.list(PATHS.files),
  ]);
  const roadmap = roadmapSource === null ? EMPTY_ROADMAP : parseRoadmap(roadmapSource, config);
  const files = listed.filter((name) => !name.startsWith("."));

  // A missing or unreadable cache only costs search results, never the vault.
  const extracted = new Map(
    await Promise.all(
      files.map(async (name) => {
        const text = await fs.readText(`${PATHS.extracted}/${name}.txt`).catch(() => null);
        return [name, text ?? ""] as const;
      }),
    ),
  );

  const resolver = createResolver(entries);
  const gepland = new Set(roadmap.doelen.map((d) => d.slug));
  const doelen = [...gepland, ...byFrequency(entries.flatMap((e) => e.doelen)).filter((d) => !gepland.has(d))];
  const fileSet = new Set(files);
  const diagnostics = [
    ...entries.flatMap((entry) => validateEntry(entry, { resolver, files: fileSet, doelen, gepland })),
    ...validateRoadmap(roadmap, resolver),
  ];

  return {
    config,
    entries,
    resolver,
    search: createSearchIndex(entries, (name) => extracted.get(name) ?? ""),
    criteria: criteriaSource ? parseCriteria(JSON.parse(criteriaSource)) : {},
    roadmap,
    files,
    doelen,
    diagnostics,
    fileUrl: (name) => (fileSet.has(name) ? fs.fileUrl(`${PATHS.files}/${name}`) : null),
    openFile: async (name) => {
      if (fileSet.has(name)) await fs.open?.(`${PATHS.files}/${name}`);
    },
  };
}

export async function missingVaultPaths(fs: VaultFs): Promise<string[]> {
  const present = await Promise.all(REQUIRED_PATHS.map((path) => fs.exists(path)));
  return REQUIRED_PATHS.filter((_, i) => !present[i]);
}

export type NewVaultConfig = Pick<
  Config,
  "student_naam" | "projectnaam" | "rol" | "semesterstart" | "sprintlengte_weken"
>;

const CONFIG_BODY = `# Configuratie

Persoonlijke instellingen van dit logboek. De app en de skills lezen dit bestand.
`;

export async function scaffoldVault(fs: WritableVaultFs, config: NewVaultConfig): Promise<void> {
  if (await fs.exists(PATHS.config)) throw new Error("Deze map bevat al een logboek");
  const fields = configSchema.parse(config);

  await Promise.all([PATHS.files, ...Object.values(ENTRY_DIRS), "data"].map((dir) => fs.mkdir(dir)));
  await Promise.all([
    fs.writeText(PATHS.config, updateFrontmatter(CONFIG_BODY, fields)),
    fs.writeText(PATHS.roadmap, ROADMAP_TEMPLATE),
  ]);
}

export function createMemoryFs(
  texts: Record<string, string>,
  urls: Record<string, string> = {},
): WritableVaultFs {
  const files = new Map(Object.entries(texts));
  const dirs = new Set<string>();
  const allPaths = () => [...files.keys(), ...Object.keys(urls)];

  return {
    async list(dir) {
      const prefix = `${dir}/`;
      const names = allPaths()
        .filter((p) => p.startsWith(prefix) && !p.slice(prefix.length).includes("/"))
        .map((p) => p.slice(prefix.length));
      return [...new Set(names)];
    },
    async exists(path) {
      return dirs.has(path) || allPaths().some((p) => p === path || p.startsWith(`${path}/`));
    },
    async readText(path) {
      return files.get(path) ?? null;
    },
    fileUrl(path) {
      return urls[path] ?? null;
    },
    async mkdir(dir) {
      const parts = dir.split("/");
      parts.forEach((_, i) => dirs.add(parts.slice(0, i + 1).join("/")));
    },
    async writeText(path, contents) {
      files.set(path, contents);
    },
  };
}

export class ConflictError extends Error {
  constructor(readonly current: string | null) {
    super("Het bestand is gewijzigd sinds het werd geopend");
  }
}

export async function saveSource(fs: WritableVaultFs, path: string, next: string, base: string): Promise<void> {
  const current = await fs.readText(path);
  if (current !== base) throw new ConflictError(current);
  await fs.writeText(path, next);
}

export async function editRoadmapFile(fs: WritableVaultFs, edits: RoadmapEdit[]): Promise<void> {
  const current = await fs.readText(PATHS.roadmap);
  await fs.writeText(PATHS.roadmap, editRoadmap(current, edits));
}
