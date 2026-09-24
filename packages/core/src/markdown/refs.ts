import type { Root } from "mdast";
import { findAndReplace } from "mdast-util-find-and-replace";
import { H_NAMES, type EntryRef, type FileRef } from "./nodes";

const FILE_REF = /(?<![\w@])@\{([^{}\n]+)\}/g;
const ENTRY_REF = /(?<![\w@])@(?:\[([^\]\n]+)\]|(\d{4}-\d{2}-\d{2})|([A-Za-z0-9](?:[\w.-]*\w)?))/g;

function fileRef(value: string, name: string): FileRef {
  const trimmed = name.trim();
  return {
    type: "fileRef",
    name: trimmed,
    value,
    data: { hName: H_NAMES.fileRef, hProperties: { name: trimmed } },
  };
}

function entryRef(value: string, bracket?: string, date?: string, bare?: string): EntryRef {
  const key = (bracket ?? date ?? bare ?? "").trim();
  return {
    type: "entryRef",
    key,
    value,
    data: { hName: H_NAMES.entryRef, hProperties: { refKey: key } },
  };
}

export function replaceReferences(tree: Root) {
  findAndReplace(
    tree,
    [
      [FILE_REF, fileRef],
      [ENTRY_REF, entryRef],
    ],
    { ignore: ["link", "linkReference"] },
  );
}
