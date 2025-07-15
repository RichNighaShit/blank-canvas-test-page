
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "default" | "muse" | "dark";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "default",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "default",
  storageKey = "dripmuse-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    try {
      const stored = localStorage.getItem(storageKey) as Theme;
      return stored && ["default", "muse", "dark"].includes(stored) ? stored : defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove all theme classes
    root.classList.remove("default", "muse", "dark");

    // Add the current theme class
    if (theme && ["default", "muse", "dark"].includes(theme)) {
      root.classList.add(theme);
    } else {
      root.classList.add("default");
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      if (["default", "muse", "dark"].includes(newTheme)) {
        try {
          localStorage.setItem(storageKey, newTheme);
          setTheme(newTheme);
        } catch (error) {
          console.warn("Failed to save theme to localStorage:", error);
          setTheme(newTheme);
        }
      }
    },
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
