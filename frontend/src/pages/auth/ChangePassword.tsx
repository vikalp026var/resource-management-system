import { useState } from "react";
import { RmsButton, RmsCard, RmsInput } from "../../components";
import { useNavigate } from "react-router-dom";
import { useChangePasswordMutation } from "../../store/api/authApi";
import { useAuth } from "../../context/AuthContext";
import { IoLockClosedSharp } from "react-icons/io5";

function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [changePassword, { isLoading, error }] = useChangePasswordMutation();

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!user?.email) {
      alert("User email not found. Please login again.");
      return;
    }

    try {
      await changePassword({
        email: user.email,
        old_password: oldPassword,
        new_password: newPassword,
      }).unwrap();
      alert("Password changed successfully");
      navigate("/home");
    } catch (error) {
      console.error("Change password failed:", error);
    }
  };

  return (
    <div className="flex justify-center py-20 bg-background">
      <RmsCard
        title="Change Password"
        subtitle="Enter your current and new password"
        className="w-full max-w-md rounded-lg p-6 text-center shadow-none border-0"
      >
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <RmsInput
            isRequired
            type="password"
            label="Current Password"
            startIcon={<IoLockClosedSharp className="w-4 h-4" />}
            placeholder="Enter your current password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <RmsInput
            isRequired
            type="password"
            label="New Password"
            startIcon={<IoLockClosedSharp className="w-4 h-4" />}
            placeholder="Enter your new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <RmsInput
            isRequired
            type="password"
            label="Confirm Password"
            startIcon={<IoLockClosedSharp className="w-4 h-4" />}
            placeholder="Confirm your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {error && (
            <p className="text-red-500 text-sm">
              {"data" in error && error.data
                ? (error.data as { detail?: string }).detail ||
                  "An error occurred"
                : "Failed to change password"}
            </p>
          )}
          <RmsButton
            type="submit"
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full font-semibold p-3 rounded-md"
            variant="secondary"
          >
            Change Password
          </RmsButton>
        </form>
      </RmsCard>
    </div>
  );
}

export default ChangePasswordPage;
