import { Input } from "@heroui/react";
import type { InputProps } from "@heroui/react";
import { useState } from "react";
import { IoEyeOffSharp, IoEyeSharp } from "react-icons/io5";

interface RmsInputProps extends InputProps {
  showCharacterCount?: boolean;
  maxCharacters?: number;
  startIcon?: React.ReactNode;
  labelWidth?: string;
  placeholder?: string;
  errorMessage?: string;
  value?: string;
}

export default function RmsInput({
  showCharacterCount = false,
  maxCharacters = 100,
  type = "text",
  classNames,
  startIcon,
  labelWidth = "w-32",
  label,
  placeholder,
  errorMessage,
  value,
  ...props
}: RmsInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const toggleVisibility = () => setShowPassword(!showPassword);

  const inputType = type === "password" && showPassword ? "text" : type;
  const isEmpty = !value || value.trim() === "";
  const displayPlaceholder =
    isEmpty && errorMessage ? errorMessage : placeholder;

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 w-full border border-border-off rounded-md p-2 bg-off min-h-10">
        {label && (
          <label
            className={`${labelWidth} shrink-0 text-sm font-medium text-foreground font-sans flex items-center gap-2`}
          >
            {startIcon && (
              <span className="text-dull shrink-0">{startIcon}</span>
            )}
            <span>{label}</span>
            {props.isRequired && <span className="text-red-500">*</span>}
          </label>
        )}
        {/* Input Section */}
        <div className="flex-1 min-w-0">
          <Input
            {...props}
            label={undefined}
            type={inputType}
            variant="bordered"
            value={value}
            placeholder={displayPlaceholder}
            errorMessage={undefined}
            isInvalid={false}
            classNames={{
              base: "w-full font-sans",
              input: [
                "text-sm font-sans text-foreground",
                isEmpty && errorMessage
                  ? "placeholder:text-red-500"
                  : "placeholder:text-dull",
                "py-1.5 outline-none focus:outline-none p-2",
              ],
              innerWrapper: "flex items-center gap-2 rounded-r-md",
              label: "text-sm font-sans font-medium text-foreground",
              errorMessage: "hidden", // Hide error message below input
              ...classNames,
            }}
            endContent={
              type === "password" ? (
                <button
                  className="focus:outline-none cursor-pointer text-dull hover:opacity-80 transition-opacity flex items-center justify-center p-1"
                  onClick={toggleVisibility}
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <IoEyeOffSharp className="w-4 h-4 text-dull" />
                  ) : (
                    <IoEyeSharp className="w-4 h-4 text-dull" />
                  )}
                </button>
              ) : null
            }
          />
        </div>
      </div>
      {showCharacterCount && (
        <div className="flex justify-end mt-1">
          <p className="text-xs text-dull font-sans">
            {String(value || "").length}/{maxCharacters}
          </p>
        </div>
      )}
    </div>
  );
}
