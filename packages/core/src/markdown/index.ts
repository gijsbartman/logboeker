import type { Root } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified, type Plugin } from "unified";
import { replaceReferences } from "./refs";
import { wrapEvidenceSpans } from "./spans";

export const remarkLogboek: Plugin<[], Root> = () => (tree) => {
  wrapEvidenceSpans(tree);
  replaceReferences(tree);
};

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkLogboek);

export function parseMarkdown(body: string): Root {
  return processor.runSync(processor.parse(body));
}

export * from "./nodes";
export { parseSpanAttrs } from "./spans";
