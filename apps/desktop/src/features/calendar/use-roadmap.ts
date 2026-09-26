import {
  roadmapStatus,
  type MijlpaalVoortgang,
  type RoadmapEdit,
} from "@logboeker/core";
import { editRoadmapFile } from "@logboeker/vault";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { formatShortDate } from "@/lib/format";
import { useVault, useVaultSource, vaultQuery } from "@/lib/vault";

export const DOEL_PREFIX = "roadmap/doel/";
export const MIJLPAAL_PREFIX = "roadmap/mijlpaal/";

export const doelRef = (slug: string) => `${DOEL_PREFIX}${slug}`;
export const mijlpaalRef = (index: number) => `${MIJLPAAL_PREFIX}${index}`;

export const MIJLPAAL_STATUS = {
  behaald: "behaald",
  verlopen: "verlopen",
  open: "open",
} as const;

export const DOEL_STATUS = {
  gepland: "gepland",
  bezig: "bezig",
  afgerond: "afgerond",
  "over-tijd": "over tijd",
} as const;

export function mijlpaalLabel({
  mijlpaal,
  status,
  bewijsAanwezig,
}: MijlpaalVoortgang) {
  if (mijlpaal.behaald) return `behaald ${formatShortDate(mijlpaal.behaald)}`;
  return bewijsAanwezig
    ? `${MIJLPAAL_STATUS[status]}, bewijs aanwezig`
    : MIJLPAAL_STATUS[status];
}

export function today() {
  return new Date().toLocaleDateString("sv-SE");
}

export function useRoadmap() {
  const { roadmap, entries, resolver } = useVault();
  const day = today();
  return useMemo(
    () => roadmapStatus(roadmap, entries, resolver, day),
    [roadmap, entries, resolver, day],
  );
}

export function useEditRoadmap() {
  const source = useVaultSource();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (edits: RoadmapEdit[]) => editRoadmapFile(source.fs, edits),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: vaultQuery(source).queryKey }),
  });
}
