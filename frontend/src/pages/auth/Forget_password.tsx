import React, { useState } from "react";
import { RmsButton, RmsCard, RmsInput } from "../../components";
import { IoMailSharp } from "react-icons/io5";

function ForgetPasswordPage() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({ email: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({ email: "" });
    try {
      console.log("Forgot password with:", { email });
    } catch (error) {
      console.error("Forgot password failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center py-20 bg-background">
      <RmsCard
        title="Forgot Password"
        subtitle="Enter your email to reset your password"
        className="w-full max-w-md rounded-lg p-6 text-center shadow-none border-0"
      >
        <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
          <RmsInput
            isRequired
            label="Email"
            startIcon={<IoMailSharp className="w-4 h-4" />}
            placeholder="Enter your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            errorMessage={errors.email}
          />
          <RmsButton
            type="button"
            onClick={handleForgotPassword}
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full font-semibold p-3 rounded-md"
            variant="secondary"
          >
            Reset Password
          </RmsButton>
        </form>
      </RmsCard>
    </div>
  );
}

export default ForgetPasswordPage;
