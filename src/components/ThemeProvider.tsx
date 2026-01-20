import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "dark" | "light";
}

const initialState: ThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
  resolvedTheme: "dark",
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "bamas-theme",
  ...props
}: ThemeProviderProps) {
  // Initialize theme: if localStorage is empty, use defaultTheme (dark), otherwise use stored value
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    const stored = localStorage.getItem(storageKey) as Theme | null;
    // If no stored value, default to "dark" (not "system")
    if (!stored || (stored !== "dark" && stored !== "light" && stored !== "system")) {
      return defaultTheme;
    }
    return stored;
  });

  // Initialize resolvedTheme: immediately determine what theme to apply
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem(storageKey) as Theme | null;
    
    // If no stored value or invalid, default to dark
    if (!stored || (stored !== "dark" && stored !== "light" && stored !== "system")) {
      return "dark";
    }
    
    // If stored is "system", check system preference
    if (stored === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    
    // Otherwise use stored value directly
    return stored;
  });

  // Apply theme immediately on mount (before React renders)
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove("light", "dark");
    
    // Apply the resolved theme immediately
    root.classList.add(resolvedTheme);
  }, []); // Run only once on mount

  // Update theme when theme state changes
  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    let effectiveTheme: "dark" | "light";

    if (theme === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } else {
      effectiveTheme = theme;
    }

    root.classList.add(effectiveTheme);
    setResolvedTheme(effectiveTheme);
  }, [theme]);

  // Listen for system theme changes when theme is "system"
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      const newTheme = e.matches ? "dark" : "light";
      root.classList.add(newTheme);
      setResolvedTheme(newTheme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
    resolvedTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
