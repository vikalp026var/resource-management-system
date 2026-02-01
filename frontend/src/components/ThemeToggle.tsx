// frontend/src/components/ThemeToggle.tsx
import { Button } from "@heroui/react";
import { useThemeContext } from "../context/ThemeContext";
import { IoMoonOutline, IoSunnyOutline } from "react-icons/io5";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeContext();

  return (
    <Button
      isIconOnly
      variant="light"
      aria-label="Toggle theme"
      onPress={toggleTheme} // 🔥 IMPORTANT
      className="hover:bg-default/20 transition-colors"
    >
      {theme === "dark" ? (
        <IoSunnyOutline className="w-5 h-5 text-foreground" />
      ) : (
        <IoMoonOutline className="w-5 h-5 text-foreground" />
      )}
    </Button>
  );
}
