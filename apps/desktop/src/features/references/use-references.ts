import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useUiStore } from "@/lib/ui-store";

const route = getRouteApi("/_vault/_workspace");

export function useReferences() {
  const { open } = route.useSearch();
  const navigate = useNavigate();
  const reveal = useUiStore((state) => state.reveal);

  const set = (next: (prev: string[]) => string[]) =>
    navigate({ to: ".", search: (prev) => ({ ...prev, open: next(prev.open ?? []) }) });

  return {
    open,
    isOpen: (id: string) => open.includes(id),
    show: (id: string) => {
      reveal(id);
      return set((prev) => (prev.includes(id) ? prev : [...prev, id]));
    },
    toggle: (id: string) => {
      if (!open.includes(id)) reveal(id);
      return set((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    },
    close: (id: string) => set((prev) => prev.filter((i) => i !== id)),
    closeAll: () => set(() => []),
    rewrite: set,
  };
}
