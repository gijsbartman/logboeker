import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SidebarTab = "filters" | "bestanden";

type UiState = {
  sidebarTab: SidebarTab;
  setSidebarTab: (tab: SidebarTab) => void;
  revealed: string | null;
  reveal: (id: string | null) => void;
  editing: string | null;
  edit: (id: string | null) => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarTab: "filters",
      setSidebarTab: (sidebarTab) => set({ sidebarTab }),
      revealed: null,
      reveal: (revealed) => set({ revealed }),
      editing: null,
      edit: (editing) => set({ editing }),
    }),
    {
      name: "logboeker-ui",
      partialize: ({ sidebarTab }) => ({ sidebarTab }),
    },
  ),
);
