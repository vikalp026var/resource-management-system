import { Button } from "@heroui/react";
import type { ButtonProps } from "@heroui/react";

type RmsButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "link"
  | "danger";

interface RmsButtonProps extends Omit<ButtonProps, "variant" | "color"> {
  variant?: RmsButtonVariant;
  classNames?: Record<string, string>;
}

const getHeroUIProps = (variant: RmsButtonVariant): Partial<ButtonProps> => {
  switch (variant) {
    case "primary":
      return { variant: "solid" }; // Remove color prop to avoid conflicts
    case "secondary":
      return { variant: "solid" }; // Remove color prop to avoid conflicts
    case "outline":
      return { color: "default", variant: "bordered" };
    case "ghost":
      return { color: "default", variant: "light" };
    case "link":
      return { color: "primary", variant: "light" };
    case "danger":
      return { color: "danger", variant: "solid" };
    default:
      return { variant: "solid" };
  }
};

export default function RmsButton({
  variant = "primary",
  children,
  className,
  classNames,
  ...props
}: RmsButtonProps) {
  const heroUIProps = getHeroUIProps(variant);

  // Add explicit blue color for primary/secondary variants
  const isBlueVariant = variant === "primary" || variant === "secondary";

  // More aggressive blue styling that targets all button elements
  const blueStyles = isBlueVariant
    ? {
        base: [
          "!bg-blue-600",
          "dark:!bg-blue-500",
          "!text-white",
          "hover:!bg-blue-700",
          "dark:hover:!bg-blue-600",
          "data-[hover=true]:!bg-blue-700",
          "dark:data-[hover=true]:!bg-blue-600",
          "data-[pressed=true]:!bg-blue-800",
          "dark:data-[pressed=true]:!bg-blue-700",
          "focus:outline-none",
          "focus:ring-0",
        ].join(" "),
      }
    : {};

  return (
    <Button
      {...heroUIProps}
      {...props}
      className={`font-sans font-semibold ${className || ""}`}
      classNames={{
        base: `focus:outline-none focus:ring-0 ${blueStyles.base || ""}`,
        ...classNames,
      }}
      style={
        isBlueVariant
          ? {
              backgroundColor: "rgb(37, 99, 235)", // blue-600
              color: "white",
            }
          : undefined
      }
    >
      {children}
    </Button>
  );
}
