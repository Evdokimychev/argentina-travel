import Image from "next/image";
import { cn } from "@/lib/cn";

interface ArgentinaLogoProps {
  className?: string;
  size?: "sm" | "md";
}

const sizeClass = {
  sm: "h-9 w-auto sm:h-10",
  md: "h-10 w-auto sm:h-11",
} as const;

/** Фирменный логотип «Пора в Аргентину» (светлая тема) */
export default function ArgentinaLogo({ className, size = "md" }: ArgentinaLogoProps) {
  return (
    <Image
      src="/logo-light.svg"
      alt="Пора в Аргентину"
      width={849}
      height={257}
      priority
      className={cn("shrink-0 object-contain object-left", sizeClass[size], className)}
    />
  );
}
