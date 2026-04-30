import { create } from "zustand";

interface ThemeState {
  dark: boolean;
  toggle: () => void;
  init: () => void;
}

function applyClass(dark: boolean) {
  if (dark) document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  dark: false,
  toggle: () => {
    const next = !get().dark;
    set({ dark: next });
    applyClass(next);
    try { localStorage.setItem("wt-dark", next ? "1" : "0"); } catch {}
  },
  init: () => {
    let dark = false;
    try { dark = localStorage.getItem("wt-dark") === "1"; } catch {}
    set({ dark });
    applyClass(dark);
  },
}));
