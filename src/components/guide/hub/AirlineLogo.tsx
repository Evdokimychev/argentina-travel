"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { getAirlineIataCodes, getAirlineInitials, getAirlineLogoSrc } from "@/lib/airline-logos";

type AirlineLogoProps = {
  name: string;
  size?: "sm" | "md";
  className?: string;
};

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
};

export default function AirlineLogo({ name, size = "sm", className }: AirlineLogoProps) {
  const codes = getAirlineIataCodes(name);
  const [failedCodes, setFailedCodes] = useState<Set<string>>(new Set());
  const visibleCodes = codes.filter((code) => !failedCodes.has(code));

  if (visibleCodes.length === 0) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg bg-charcoal/5 text-xs font-bold text-charcoal",
          sizeClasses[size],
          className
        )}
        aria-hidden
      >
        {getAirlineInitials(name)}
      </span>
    );
  }

  if (visibleCodes.length > 1) {
    return (
      <span className={cn("flex shrink-0 -space-x-1", className)}>
        {visibleCodes.map((code) => (
          <AirlineLogoImage
            key={code}
            code={code}
            name={name}
            size={size}
            onError={() => setFailedCodes((prev) => new Set(prev).add(code))}
          />
        ))}
      </span>
    );
  }

  return (
    <AirlineLogoImage
      code={visibleCodes[0]}
      name={name}
      size={size}
      className={className}
      onError={() => setFailedCodes((prev) => new Set(prev).add(visibleCodes[0]))}
    />
  );
}

function AirlineLogoImage({
  code,
  name,
  size,
  className,
  onError,
}: {
  code: string;
  name: string;
  size: "sm" | "md";
  className?: string;
  onError: () => void;
}) {
  const px = size === "sm" ? 32 : 40;

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-white",
        sizeClasses[size],
        className
      )}
    >
      <Image
        src={getAirlineLogoSrc(code)}
        alt={name}
        width={px}
        height={px}
        className="h-full w-full object-contain p-0.5"
        onError={onError}
      />
    </span>
  );
}
