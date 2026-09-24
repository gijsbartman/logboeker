import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SidebarTab = "filters" | "bestanden";

type UiState = {
  sidebarTab: SidebarTab;
  setSidebarTab: (tab: SidebarTab) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarTab: "filters",
      setSidebarTab: (sidebarTab) => set({ sidebarTab }),
    }),
    { name: "logboeker-ui" },
  ),
);
