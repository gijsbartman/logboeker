import { readFrontmatter, splitFrontmatter } from "./frontmatter";
import { configSchema, type Config } from "./schema";

export function parseConfig(source: string): Config {
  const read = readFrontmatter(splitFrontmatter(source).yaml);
  if (!read.ok) throw new Error(`data/config.md: ${read.error}`);
  return configSchema.parse(read.data);
}
