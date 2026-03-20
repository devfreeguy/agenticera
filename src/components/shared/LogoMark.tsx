import Image from "next/image";
import { cn } from "@/lib/utils";
import { BRAND_NAME } from "@/constants/brand";

interface LogoMarkProps {
  /** "default" = logo.webp (orange bg, for use on dark surfaces as a brand icon)
   *  "dark"    = logo-dark.webp (dark bg, for use as a centered logomark on cards) */
  variant?: "default" | "dark";
  size?: number;
  className?: string;
}

export function LogoMark({
  variant = "default",
  size = 30,
  className,
}: LogoMarkProps) {
  const src =
    variant === "dark"
      ? "/assets/app/logo-dark.webp"
      : "/assets/app/logo.webp";

  return (
    <Image
      src={src}
      alt={BRAND_NAME}
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      priority
    />
  );
}
