import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { HeroUIProvider } from "@heroui/react";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { Provider } from "react-redux";
import { store } from "./store/store.ts";

function HeroUIWrapper() {
  // const { theme } = useThemeContext();

  return (
    <HeroUIProvider locale="en-US">
      <App />
    </HeroUIProvider>
  );
}

function Root() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AuthProvider>
          <HeroUIWrapper />
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
