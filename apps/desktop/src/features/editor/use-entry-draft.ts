import { replaceBody, splitFrontmatter, updateFrontmatter, type Entry } from "@logboeker/core";
import { ConflictError, saveSource } from "@logboeker/vault";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useVaultSource, vaultQuery } from "@/lib/vault";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_MS = 800;

export function useEntryDraft(entry: Entry) {
  const source = useVaultSource();
  const queryClient = useQueryClient();
  const [base, setBase] = useState(entry.source);
  const [body, setBody] = useState(entry.body);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [conflict, setConflict] = useState<string | null>(null);
  const next = replaceBody(base, body);
  const dirty = next !== base;

  const write = useCallback(
    async (contents: string, expected: string) => {
      setStatus("saving");
      try {
        await saveSource(source.fs, entry.path, contents, expected);
        setBase(contents);
        setConflict(null);
        setStatus("saved");
        await queryClient.invalidateQueries({ queryKey: vaultQuery(source).queryKey });
      } catch (error) {
        if (error instanceof ConflictError) {
          setConflict(error.current ?? "");
          setStatus("idle");
        } else {
          setStatus("error");
        }
      }
    },
    [source, entry.path, queryClient],
  );

  useEffect(() => {
    if (entry.source === base) return;
    if (dirty) {
      setConflict(entry.source);
    } else {
      setBase(entry.source);
      setBody(splitFrontmatter(entry.source).body);
    }
    // Only a change on disk should trigger this, not our own edits.
  }, [entry.source]);

  const pending = useRef({ dirty, conflict, next, base, write });
  pending.current = { dirty, conflict, next, base, write };

  useEffect(() => {
    if (!dirty || conflict !== null) return;
    const timer = setTimeout(() => void write(next, base), AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [dirty, conflict, next, base, write]);

  const flush = useCallback(async () => {
    const { dirty, conflict, next, base, write } = pending.current;
    if (dirty && conflict === null) await write(next, base);
  }, []);

  return {
    body,
    setBody,
    status,
    dirty,
    conflict,
    flush,
    updateFields: (patch: Record<string, unknown>) => write(updateFrontmatter(next, patch), base),
    keepMine: () => conflict !== null && write(replaceBody(conflict, body), conflict),
    takeTheirs: () => {
      if (conflict === null) return;
      setBase(conflict);
      setBody(splitFrontmatter(conflict).body);
      setConflict(null);
    },
  };
}
