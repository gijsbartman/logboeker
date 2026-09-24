import { createMemoryFs } from "@logboeker/vault";

const ROOT = "../../../../fixtures/vault/";

const texts = import.meta.glob<string>(
  ["../../../../fixtures/vault/**/*.md", "../../../../fixtures/vault/**/*.json"],
  { query: "?raw", import: "default", eager: true },
);
const urls = import.meta.glob<string>("../../../../fixtures/vault/logboek/files/*", {
  query: "?url",
  import: "default",
  eager: true,
});

const strip = (files: Record<string, string>) =>
  Object.fromEntries(Object.entries(files).map(([path, value]) => [path.slice(ROOT.length), value]));

export const demoFs = createMemoryFs(strip(texts), strip(urls));
