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

export interface EntryRef {
  type: "entryRef";
  key: string;
  value: string;
  data?: { hName: string; hProperties: Record<string, unknown> };
}

export interface FileRef {
  type: "fileRef";
  name: string;
  value: string;
  data?: { hName: string; hProperties: Record<string, unknown> };
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
