import type { ElementContent } from "hast";
import type { PhrasingContent } from "mdast";
import type { Vaardigheid } from "../vaardigheden";

export interface EvidenceSpan {
  type: "evidenceSpan";
  vaardigheden: Vaardigheid[];
  beroepstaken: string[];
  unknownClasses: string[];
  niveau: number | null;
  children: PhrasingContent[];
  data?: { hName: string; hProperties: Record<string, unknown> };
}

type RefData = { hName: string; hProperties: Record<string, unknown>; hChildren: ElementContent[] };

export interface EntryRef {
  type: "entryRef";
  key: string;
  value: string;
  data?: RefData;
}

export interface FileRef {
  type: "fileRef";
  name: string;
  value: string;
  data?: RefData;
}

declare module "mdast" {
  interface PhrasingContentMap {
    evidenceSpan: EvidenceSpan;
    entryRef: EntryRef;
    fileRef: FileRef;
  }
  interface RootContentMap {
    evidenceSpan: EvidenceSpan;
    entryRef: EntryRef;
    fileRef: FileRef;
  }
}

// Element names the nodes become after remark-rehype; renderers map these.
export const H_NAMES = {
  evidenceSpan: "evidence-span",
  entryRef: "entry-ref",
  fileRef: "file-ref",
} as const;
