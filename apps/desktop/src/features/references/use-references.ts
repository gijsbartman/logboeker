import { getRouteApi, useNavigate } from "@tanstack/react-router";

const route = getRouteApi("/_vault/_workspace");

export function useReferences() {
  const { open } = route.useSearch();
  const navigate = useNavigate();

  const set = (next: (prev: string[]) => string[]) =>
    navigate({ to: ".", search: (prev) => ({ ...prev, open: next(prev.open ?? []) }) });

  return {
    open,
    isOpen: (id: string) => open.includes(id),
    show: (id: string) => set((prev) => (prev.includes(id) ? prev : [...prev, id])),
    toggle: (id: string) => set((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])),
    close: (id: string) => set((prev) => prev.filter((i) => i !== id)),
    closeAll: () => set(() => []),
    rewrite: set,
  };
}
