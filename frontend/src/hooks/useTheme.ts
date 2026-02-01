import { useState, useEffect } from "react";

type Theme = "light" | "dark";

// Get initial theme - this matches the script in index.html
function getInitialTheme(): Theme {
  const stored = localStorage.getItem("theme") as Theme;
  if (stored) return stored;

  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add(theme);

    const mainElement = document.querySelector("main");
    if (mainElement) {
      mainElement.classList.remove("light", "dark");
      mainElement.classList.add(theme);
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return { theme, setTheme, toggleTheme };
}
