import { createContext, useContext, useState, type ReactNode } from "react";
import { useGetCurrentUserQuery } from "../store/api/authApi";
import type { User } from "../store/api/authApi";

interface AuthContextType {
  user: User | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isHR: boolean;
  isEmployee: boolean;
  hasRole: (roles: string[]) => boolean;
  setAuthToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem("access_token"),
  );

  // Only fetch user if token exists
  const {
    data: user,
    isLoading,
    isError,
  } = useGetCurrentUserQuery(undefined, {
    skip: !token,
  });

  const isAuthenticated = !!token && (!!user || (isLoading && !isError));
  const isAdmin = user?.role === "admin" || user?.is_superuser || false;
  const isHR = user?.role === "hr";
  const isEmployee = user?.role === "employee" || false;

  const hasRole = (roles: string[]) => {
    if (!user) return false;
    if (user.is_superuser) return true; // Superuser has all access
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isAdmin,
        isHR,
        isEmployee,
        hasRole,
        setAuthToken: (token: string | null) => {
          if (token) {
            localStorage.setItem("access_token", token);
          } else {
            localStorage.removeItem("access_token");
          }
          setToken(token);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
