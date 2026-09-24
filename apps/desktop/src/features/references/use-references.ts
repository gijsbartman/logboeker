import { getRouteApi } from "@tanstack/react-router";

const route = getRouteApi("/");

export function useReferences() {
  const { open } = route.useSearch();
  const navigate = route.useNavigate();

  const set = (next: (prev: string[]) => string[]) =>
    navigate({ search: (prev) => ({ ...prev, open: next(prev.open ?? []) }) });

  return {
    open,
    isOpen: (id: string) => open.includes(id),
    show: (id: string) => set((prev) => (prev.includes(id) ? prev : [...prev, id])),
    toggle: (id: string) => set((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])),
    close: (id: string) => set((prev) => prev.filter((i) => i !== id)),
    closeAll: () => set(() => []),
  };
}
