import { Link } from "@heroui/react";
import { RmsButton, RmsCard, RmsInput } from "../../components";
import { useEffect, useState } from "react";
import {
  IoPersonCircleSharp,
  IoMailSharp,
  IoLockClosedSharp,
} from "react-icons/io5";
import { useRegisterMutation } from "../../store/api/authApi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [register, { isLoading, error }] = useRegisterMutation();

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await register({ email, password, confirmPassword, fullName }).unwrap();
      toast.success("Signup successful");
      navigate("/login");
    } catch (error) {
      toast.error("Signup failed");
      console.error("Signup failed:", error);
    }
  };
  return (
    <div className="flex justify-center py-20 pb-40 bg-background">
      <RmsCard
        title="Create an account"
        subtitle="Sign up to your account to continue"
        className="w-full max-w-md rounded-lg p-6 text-center shadow-none border-0"
      >
        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <RmsInput
            isRequired
            label="Username"
            startIcon={<IoPersonCircleSharp className="w-4 h-4" />}
            placeholder="Enter your full name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <RmsInput
            isRequired
            label="Email"
            startIcon={<IoMailSharp className="w-4 h-4" />}
            placeholder="Enter your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <RmsInput
            isRequired
            label="Password"
            startIcon={<IoLockClosedSharp className="w-4 h-4" />}
            placeholder="Enter your password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <RmsInput
            isRequired
            label="Confirm Password"
            startIcon={<IoLockClosedSharp className="w-4 h-4" />}
            placeholder="Confirm your password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {error && (
            <p className="text-red-500 text-sm">
              {"data" in error && error.data
                ? (error.data as { detail?: string }).detail ||
                  "An error occurred"
                : "An error occurred"}
            </p>
          )}
          <RmsButton
            type="submit"
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full font-semibold p-3 rounded-md"
            variant="secondary"
          >
            Create Account
          </RmsButton>
          <div className="text-center text-sm mt-4">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary font-semibold text-blue-600"
            >
              Login
            </Link>
          </div>
        </form>
      </RmsCard>
    </div>
  );
}

export default SignupPage;
