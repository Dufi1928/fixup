"use client";
import { useTheme } from "@/lib/theme-context";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Activer le thème clair" : "Activer le thème sombre"}
      className="inline-flex items-center gap-2 rounded-md border border-gray-200/60 bg-white/80 px-3 py-2 text-sm font-medium shadow-sm backdrop-blur hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
    >
      {theme === "dark" ? (
        // Sun icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0 4a1 1 0 0 1-1-1v-1a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1ZM5 12a1 1 0 0 1-1 1H3a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1Zm8-9v1a1 1 0 1 1-2 0V3a1 1 0 1 1 2 0Zm8 9a1 1 0 0 1-1 1h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1ZM6.222 18.364a1 1 0 0 1-1.414 0l-.707-.707a1 1 0 1 1 1.414-1.414l.707.707a1 1 0 0 1 0 1.414Zm13.677-.707-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 1 1 1.414 1.414ZM4.808 6.343a1 1 0 0 1 0-1.414l.707-.707A1 1 0 1 1 6.93 5.636l-.707.707a1 1 0 0 1-1.414 0Zm12.728-.707.707-.707A1 1 0 1 1 19.657 6.343l-.707.707a1 1 0 0 1-1.414-1.414Z" />
        </svg>
      ) : (
        // Moon icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M21.752 15.002A9 9 0 1 1 12.998 2.25c.31 0 .614.02.913.058a1 1 0 0 1 .41 1.816 7 7 0 0 0 8.556 8.556 1 1 0 0 1 1.816.41c.037.299.057.603.057.912Z" />
        </svg>
      )}
      <span className="hidden sm:inline">{theme === "dark" ? "Clair" : "Sombre"}</span>
    </button>
  );
}
