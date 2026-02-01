import { InputOtp } from "@heroui/react";

interface RmsOtpInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  errorMessage?: string;
}

export default function RmsOtpInput({
  length,
  value,
  onChange,
  errorMessage,
}: RmsOtpInputProps) {
  return (
    <div className="w-full flex justify-center">
      <InputOtp
        length={length}
        value={value}
        onValueChange={onChange}
        errorMessage={errorMessage}
        isInvalid={!!errorMessage}
        classNames={{
          base: "w-full justify-center flex-row gap-2",
          wrapper: "flex flex-row gap-2",
          segmentWrapper: "flex flex-row gap-2",
          segment: [
            "bg-content1",
            "text-foreground",
            "border-2 border-divider",
            "w-12 h-12",
            "text-center text-lg font-semibold",
            "rounded-md",
            "focus:border-primary",
            "transition-colors",
          ].join(" "),
        }}
      />
    </div>
  );
}
