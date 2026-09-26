import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { DEFAULT_SEARCH, type FilterKey, type Search } from "./search";

const route = getRouteApi("/_vault/_workspace");

export function useFilters() {
  const search = route.useSearch();
  const navigate = useNavigate();

  const update = (next: (prev: Search) => Partial<Search>) =>
    navigate({ to: ".", search: (prev) => ({ ...prev, ...next({ ...DEFAULT_SEARCH, ...prev }) }), replace: true });

  return {
    search,
    isActive: <K extends FilterKey>(key: K, value: Search[K][number]) =>
      (search[key] as readonly unknown[]).includes(value),
    toggle: <K extends FilterKey>(key: K, value: Search[K][number]) =>
      update((prev) => {
        const list = prev[key] as readonly unknown[];
        return { [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
      }),
    set: <K extends FilterKey>(key: K, values: Search[K]) => update(() => ({ [key]: values })),
    setGroup: (groep: Search["groep"]) => update(() => ({ groep })),
    reset: () => update(() => ({ ...DEFAULT_SEARCH, open: search.open })),
  };
}
