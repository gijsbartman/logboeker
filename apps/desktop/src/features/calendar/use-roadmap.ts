import {
  roadmapStatus,
  type ItemVoortgang,
  type RoadmapEdit,
} from "@logboeker/core";
import { editRoadmapFile } from "@logboeker/vault";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useReferences } from "@/features/references/use-references";
import { formatShortDate } from "@/lib/format";
import { useVault, useVaultSource, vaultQuery } from "@/lib/vault";

export const ITEM_PREFIX = "roadmap/item/";

export const itemRef = (index: number) => `${ITEM_PREFIX}${index}`;

export const ITEM_STATUS = {
  gepland: "gepland",
  bezig: "bezig",
  afgerond: "afgerond",
  verlopen: "verlopen",
} as const;

export function itemLabel({ item, status, bewijsAanwezig }: ItemVoortgang) {
  if (item.afgerond) return `afgerond ${formatShortDate(item.afgerond)}`;
  return bewijsAanwezig
    ? `${ITEM_STATUS[status]}, bewijs aanwezig`
    : ITEM_STATUS[status];
}

export function itemPeriod({ item }: ItemVoortgang) {
  return item.meerdaags
    ? `${formatShortDate(item.start)} tot ${formatShortDate(item.eind)}`
    : formatShortDate(item.start);
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

// Item ids are list positions, so open cards after the removed one shift up.
export function useRemoveItem() {
  const edit = useEditRoadmap();
  const { rewrite } = useReferences();

  return {
    ...edit,
    remove: (index: number, onSuccess?: () => void) =>
      edit.mutate([{ action: "remove", index }], {
        onSuccess: () => {
          rewrite((ids) =>
            ids.flatMap((id) => {
              if (!id.startsWith(ITEM_PREFIX)) return [id];
              const other = Number(id.slice(ITEM_PREFIX.length));
              if (other === index) return [];
              return [other > index ? itemRef(other - 1) : id];
            }),
          );
          onSuccess?.();
        },
      }),
  };
}
