import { create } from "zustand";
export type ThemeMode = "system" | "light" | "dark";
interface State {
  busy: boolean;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  revision: number;
  changed: () => void;
}
export const useAppStore = create<State>((set) => ({
  busy: false,
  theme: "system",
  setTheme: (theme) => set({ theme }),
  revision: 0,
  changed: () => set((s) => ({ revision: s.revision + 1 })),
}));
