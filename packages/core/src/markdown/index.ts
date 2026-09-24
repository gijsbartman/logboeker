import type { Root } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified, type Plugin, type PluggableList } from "unified";
import { replaceReferences } from "./refs";
import { wrapEvidenceSpans } from "./spans";

export const remarkLogboek: Plugin<[], Root> = () => (tree) => {
  wrapEvidenceSpans(tree);
  replaceReferences(tree);
};

export const logboekRemarkPlugins: PluggableList = [remarkGfm, remarkLogboek];

const processor = unified().use(remarkParse).use(logboekRemarkPlugins);

export function parseMarkdown(body: string): Root {
  return processor.runSync(processor.parse(body)) as Root;
}

export * from "./nodes";
export { formatSpanAttrs, parseSpanAttrs } from "./spans";
export { checkInRange, scanSource, type SourceRef, type SourceSpan } from "./source";
