import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

export type ColorTheme = "cyan-gold" | "ember-warm" | "sage-earth";
export type Mode = "dark" | "light";

type ThemeContextType = {
  colorTheme: ColorTheme;
  mode: Mode;
  setColorTheme: (theme: ColorTheme) => void;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  colorTheme: "cyan-gold",
  mode: "dark",
  setColorTheme: () => {},
  setMode: () => {},
  toggleMode: () => {},
});

export const THEME_LABELS: Record<ColorTheme, string> = {
  "cyan-gold": "Cyan & Gold",
  "ember-warm": "Ember & Warm",
  "sage-earth": "Sage & Earth",
};

export const THEME_PREVIEW: Record<ColorTheme, { primary: string; accent: string }> = {
  "cyan-gold": { primary: "#22D3EE", accent: "#F4BE44" },
  "ember-warm": { primary: "#E87040", accent: "#D4A574" },
  "sage-earth": { primary: "#6BA368", accent: "#C4956A" },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    try {
      return (localStorage.getItem("afrokaviar-color-theme") as ColorTheme) || "cyan-gold";
    } catch {
      return "cyan-gold";
    }
  });

  const [mode, setModeState] = useState<Mode>(() => {
    try {
      return (localStorage.getItem("afrokaviar-mode") as Mode) || "dark";
    } catch {
      return "dark";
    }
  });

  const setColorTheme = useCallback((theme: ColorTheme) => {
    setColorThemeState(theme);
    try { localStorage.setItem("afrokaviar-color-theme", theme); } catch {}
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    try { localStorage.setItem("afrokaviar-mode", m); } catch {}
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", colorTheme);
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [colorTheme, mode]);

  return (
    <ThemeContext.Provider value={{ colorTheme, mode, setColorTheme, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
