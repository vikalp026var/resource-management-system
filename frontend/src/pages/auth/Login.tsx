import { useState } from "react";
import { RmsButton, RmsCard, RmsInput } from "../../components";
import { Link } from "@heroui/react";
import { IoLockClosedSharp, IoMailSharp } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../store/api/authApi";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const { setAuthToken } = useAuth();
  const [password, setPassword] = useState("");

  const [login, { isLoading, error }] = useLoginMutation();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await login({ email, password }).unwrap();
      setAuthToken(response.access_token);
      toast.success("Login successful");
      navigate("/home", { replace: true });
    } catch (error) {
      toast.error("Login failed");
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="flex justify-center py-20 pb-40 bg-background">
      <RmsCard
        title="Welcome Back"
        subtitle="Sign in to your account to continue"
        classNames={{
          base: "w-full max-w-md rounded-lg text-center",
          body: "p-6",
        }}
      >
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <RmsInput
            isRequired
            label="Email"
            startIcon={<IoMailSharp className="w-4 h-4" />}
            placeholder="Enter your email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
          <RmsInput
            isRequired
            label="Password"
            startIcon={<IoLockClosedSharp className="w-4 h-4" />}
            placeholder="Enter your password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
          {error && (
            <p className="text-red-500 text-sm">
              {"data" in error && error.data
                ? (error.data as { detail?: string }).detail ||
                  "An error occurred"
                : "An error occurred"}
            </p>
          )}
          <div className="flex justify-end">
            <Link
              href="/forget-password"
              size="sm"
              className="text-primary text-blue-600"
            >
              Forgot password?
            </Link>
          </div>
          <RmsButton
            type="submit"
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full font-semibold p-3 rounded-md"
            variant="secondary"
          >
            Login
          </RmsButton>
          <div className="text-center text-sm mt-4">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-primary font-semibold text-blue-600"
            >
              Sign up
            </Link>
          </div>
        </form>
      </RmsCard>
    </div>
  );
}

export default LoginPage;
