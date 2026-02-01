import { useState } from "react";
import { RmsButton, RmsCard } from "../../components";
import RmsOtpInput from "../../components/RmsOtpInput";
import { useNavigate } from "react-router-dom";

function OTP_VerificationPage() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(""); // Changed from string[] to string
  const [errors, setErrors] = useState({ otp: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleOTPVerification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setErrors({ otp: "Invalid OTP or Please enter a valid 6 digit OTP" });
      return;
    }
    setIsLoading(true);
    setErrors({ otp: "" });
    try {
      console.log("OTP Verification:", otp);
      navigate("/reset-password");
    } catch (error) {
      console.error("OTP Verification failed:", error);
      setErrors({ otp: "Invalid OTP or Please enter a valid 6 digit OTP" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center py-20 bg-background">
      <RmsCard
        title="OTP Verification"
        subtitle="Enter the OTP sent to your email"
        className="w-full max-w-md rounded-lg p-6 text-center shadow-none border-0"
      >
        <form onSubmit={handleOTPVerification} className="flex flex-col gap-4">
          <RmsOtpInput
            length={6}
            value={otp}
            onChange={(value) => {
              setOtp(value);
              if (errors.otp) setErrors({ ...errors, otp: "" });
            }}
            errorMessage={errors.otp}
          />
          <RmsButton
            type="submit"
            isLoading={isLoading}
            disabled={isLoading || otp.length !== 6}
            className="w-full font-semibold p-3 rounded-md"
            variant="secondary"
          >
            Verify OTP
          </RmsButton>
        </form>
      </RmsCard>
    </div>
  );
}

export default OTP_VerificationPage;
