import { readFrontmatter, splitFrontmatter } from "./frontmatter";
import { configSchema, type Config } from "./schema";

export function parseConfig(source: string): Config {
  const read = readFrontmatter(splitFrontmatter(source).yaml);
  if (!read.ok) throw new Error(`config.md: ${read.error}`);
  // An empty field (`code_repo:`) parses as null and means "not set yet".
  const fields = Object.entries(read.data).filter(([, value]) => value != null);
  return configSchema.parse(Object.fromEntries(fields));
}
