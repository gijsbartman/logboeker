import { H_NAMES, logboekRemarkPlugins } from "@logboeker/core";
import { cn } from "cn";
import type { Root } from "mdast";
import type { ComponentProps } from "react";
import Markdown, { type Components } from "react-markdown";
import { FileReference } from "@/features/attachments/file-reference";
import { EntryReference } from "@/features/references/entry-reference";
import { EvidenceSpan } from "@/features/skills/evidence-span";
import "@/features/editorial.css";

function remarkDropTitle() {
  return (tree: Root) => {
    const index = tree.children.findIndex(
      (node) => node.type === "heading" && node.depth === 1,
    );
    if (index !== -1) tree.children.splice(index, 1);
  };
}

const components = {
  [H_NAMES.evidenceSpan]: EvidenceSpan,
  [H_NAMES.entryRef]: EntryReference,
  [H_NAMES.fileRef]: FileReference,
} as Components;

type MarkdownBodyProps = ComponentProps<"div"> & {
  markdown: string;
  dropTitle?: boolean;
};

export function MarkdownBody({
  markdown,
  dropTitle = true,
  className,
  ...props
}: MarkdownBodyProps) {
  return (
    <div
      className={cn(
        "reading-copy prose prose-sm dark:prose-invert max-w-none",
        className,
      )}
      {...props}
    >
      <Markdown
        remarkPlugins={
          dropTitle
            ? [...logboekRemarkPlugins, remarkDropTitle]
            : logboekRemarkPlugins
        }
        components={components}
      >
        {markdown}
      </Markdown>
    </div>
  );
}
