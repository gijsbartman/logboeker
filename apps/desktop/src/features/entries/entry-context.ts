import type { Entry } from "@logboeker/core";
import { createContext, useContext } from "react";

export type EntryContextValue = {
  entry: Entry;
  openFiles: string[];
  toggleFile: (name: string) => void;
};

export const EntryContext = createContext<EntryContextValue | null>(null);

export function useEntry() {
  const context = useContext(EntryContext);
  if (!context) throw new Error("useEntry must be used inside <Entry>");
  return context;
}
