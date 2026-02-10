import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "@heroui/react";

export default function LandingRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner color="success" />
      </div>
    );
  }
  if (isAuthenticated) {
    return <Navigate to={isAuthenticated ? "/home" : "/login"} replace />;
  }
}
