import { createBrowserRouter } from "react-router-dom";
import LoginPage from "./pages/auth/Login";
import SignupPage from "./pages/auth/Signup";
import ForgetPasswordPage from "./pages/auth/Forget_password";
import OTP_VerificationPage from "./pages/auth/OTP_Verification";
import ChangePasswordPage from "./pages/auth/ChangePassword";
import HomePage from "./pages/main/Home";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingRedirect from "./components/LandingRedirect";
import AdminDashBoard from "./pages/admin/AdminDashBoard";
import Assets from "./pages/main/Assets";
import Requests from "./pages/main/Requests";
import Offices from "./pages/main/Offices";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <LandingRedirect />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "signup",
        element: <SignupPage />,
      },
      {
        path: "forget-password",
        element: <ForgetPasswordPage />,
      },
      {
        path: "verify-otp",
        element: <OTP_VerificationPage />,
      },
      {
        path: "reset-password",
        element: <ChangePasswordPage />,
      },
      // Protected routes
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "home",
            element: <HomePage />,
          },
          {
            path: "assets",
            element: <Assets />,
          },
          {
            path: "requests",
            element: <Requests />,
          },
          {
            path: "offices",
            element: <Offices />,
          },
        ],
      },
      // Admin HR routes
      {
        element: <ProtectedRoute requiredRoles={["admin", "hr"]} />,
        children: [
          {
            path: "admin",
            element: <AdminDashBoard />,
          },
          {
            path: "admin/users",
            element: <AdminDashBoard />,
          },
        ],
      },
    ],
  },
]);

export default router;
