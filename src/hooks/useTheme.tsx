import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
} from "react";

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

const VALID_THEMES: Theme[] = ["default", "muse", "dark"];

function isValidTheme(theme: string): theme is Theme {
  return VALID_THEMES.includes(theme as Theme);
}

export function ThemeProvider({
  children,
  defaultTheme = "default",
  storageKey = "dripmuse-ui-theme",
  ...props
}: ThemeProviderProps) {
  // Initialize with safe default - use function form to avoid early evaluation
  const [theme, setThemeState] = React.useState<Theme>(() => defaultTheme);
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Safe theme setter with validation
  const setTheme = useCallback(
    (newTheme: Theme) => {
      if (!isValidTheme(newTheme)) {
        console.warn(`Invalid theme: ${newTheme}. Using default theme.`);
        return;
      }

      setThemeState(newTheme);

      // Safely save to localStorage
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          localStorage.setItem(storageKey, newTheme);
        } catch (error) {
          console.warn("Failed to save theme to localStorage:", error);
        }
      }
    },
    [storageKey],
  );

  // Load theme from localStorage after mount (hydration)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let mounted = true;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored && isValidTheme(stored) && mounted) {
        setThemeState(stored);
      }
    } catch (error) {
      console.warn("Failed to load theme from localStorage:", error);
    } finally {
      if (mounted) {
        setIsHydrated(true);
      }
    }

    return () => {
      mounted = false;
    };
  }, [storageKey]);

  // Apply theme to document
  useEffect(() => {
    if (typeof window === "undefined" || !window.document) return;

    try {
      const root = window.document.documentElement;

      // Remove all theme classes
      VALID_THEMES.forEach((t) => root.classList.remove(t));

      // Add current theme class
      if (isValidTheme(theme)) {
        root.classList.add(theme);
      } else {
        root.classList.add("default");
      }
    } catch (error) {
      console.warn("Failed to apply theme classes:", error);
    }
  }, [theme]);

  // Context value
  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme, setTheme],
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
