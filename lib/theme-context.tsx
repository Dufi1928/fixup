"use client";
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemPref(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyThemeAttr(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  // Toggle Tailwind's dark variant support
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  // Hint to the UA for form controls/colors
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initialize from localStorage or system
    const stored = typeof window !== "undefined" ? (localStorage.getItem("theme") as Theme | null) : null;
    const next = stored ?? getSystemPref();
    setThemeState(next);
    applyThemeAttr(next);
    setMounted(true);

    // Listen for system changes only when user hasn't chosen explicitly
    const mql = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const onChange = () => {
      const manual = localStorage.getItem("theme");
      if (!manual) {
        const sys = getSystemPref();
        setThemeState(sys);
        applyThemeAttr(sys);
      }
    };
    mql?.addEventListener?.("change", onChange);
    return () => mql?.removeEventListener?.("change", onChange);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyThemeAttr(t);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", t);
    }
  };

  const toggle = () => setTheme(theme === "light" ? "dark" : "light");

  const value = useMemo(() => ({ theme, toggle, setTheme }), [theme]);

  // Avoid flash of wrong theme but keep context available
  return (
    <ThemeContext.Provider value={value}>
      <div style={mounted ? undefined : { visibility: "hidden" }}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme doit être utilisé dans ThemeProvider");
  return ctx;
}
