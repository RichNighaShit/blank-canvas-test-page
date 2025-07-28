import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

type Theme = "default" | "muse" | "dark" | "forest";

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

const VALID_THEMES: Theme[] = ["default", "muse", "dark", "forest"];

function isValidTheme(theme: string): theme is Theme {
  return VALID_THEMES.includes(theme as Theme);
}

export function ThemeProvider({
  children,
  defaultTheme = "default",
  storageKey = "dripmuse-ui-theme",
  ...props
}: ThemeProviderProps) {
  // Initialize with safe default
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [isHydrated, setIsHydrated] = useState(false);

  // Safe theme setter with validation and localStorage sync
  const setTheme = useCallback(
    (newTheme: Theme) => {
      if (!isValidTheme(newTheme)) {
        console.warn(`Invalid theme: ${newTheme}. Using default theme.`);
        return;
      }
      setThemeState(newTheme);
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          localStorage.setItem(storageKey, newTheme);
        } catch (error) {
          console.warn("Failed to save theme to localStorage:", error);
        }
      }
    },
    [storageKey]
  );

  // Load theme from localStorage after mount (hydration)
  useEffect(() => {
    if (typeof window === "undefined") return;
    let mounted = true;
    const loadTheme = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored && mounted) {
          // Use setTheme for validation and localStorage sync
          setTheme(stored as Theme);
        }
      } catch (error) {
        console.warn("Failed to load theme from localStorage:", error);
      } finally {
        if (mounted) {
          setIsHydrated(true);
        }
      }
    };
    loadTheme();
    return () => {
      mounted = false;
    };
  }, [storageKey, setTheme]);

  // Apply theme to document
  useEffect(() => {
    if (typeof window === "undefined" || !window.document) return;
    try {
      const root = window.document.documentElement;
      VALID_THEMES.forEach((t) => root.classList.remove(t));
      if (isValidTheme(theme)) {
        root.classList.add(theme);
      } else {
        root.classList.add("default");
      }
    } catch (error) {
      console.warn("Failed to apply theme classes:", error);
    }
  }, [theme]);

  // Context value (stable)
  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme, setTheme]
  );

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
