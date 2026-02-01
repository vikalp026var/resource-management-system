import { createContext, useContext } from "react";
import { useTheme } from "../hooks/useTheme";

type ThemeContextType = ReturnType<typeof useTheme>;

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeState = useTheme();
  return (
    <ThemeContext.Provider value={themeState}>{children}</ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);

  if (context === null) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }

  return context;
}
