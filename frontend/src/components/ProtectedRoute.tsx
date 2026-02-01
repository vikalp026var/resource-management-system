import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "@heroui/react";

interface ProtectedRouteProps {
  requiredRoles?: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  requiredRoles,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner color="success" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} />;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
