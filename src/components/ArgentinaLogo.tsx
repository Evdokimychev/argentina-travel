import { cn } from "@/lib/cn";

/** Хвост самолёта с флагом Аргентины — как в фирменном логотипе */
function AirplaneLogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Fuselage */}
      <path
        d="M2 38C2 38 18 26 48 26H62C70 26 74 30 74 36C74 42 70 46 62 46H48C18 46 2 38 2 38Z"
        fill="#2E2E2E"
      />
      <path
        d="M2 38C2 38 22 30 48 30H60C66 30 70 33 70 36C70 39 66 42 60 42H48C22 42 2 38 2 38Z"
        fill="#454545"
        opacity="0.55"
      />
      <ellipse cx="8" cy="38" rx="5" ry="7" fill="#1F1F1F" />

      {/* Windows */}
      {[22, 32, 42, 52, 62].map((x) => (
        <circle key={x} cx={x} cy={36} r={1.6} fill="#8E8E8E" />
      ))}

      {/* Tail fin base */}
      <path
        d="M62 18L92 10V58L62 52V18Z"
        fill="#303030"
      />

      {/* Argentine flag on tail */}
      <path d="M66 20H88V58H66V20Z" fill="#74ACDF" />
      <path d="M66 33H88V45H66V33Z" fill="white" />
      <path d="M66 45H88V58H66V45Z" fill="#74ACDF" />
      <circle cx="77" cy="39" r="6.5" fill="#FCBF49" />
      <g fill="#F5E6C8" opacity="0.9">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 77 + Math.cos(rad) * 3.2;
          const y1 = 39 + Math.sin(rad) * 3.2;
          const x2 = 77 + Math.cos(rad) * 5.2;
          const y2 = 39 + Math.sin(rad) * 5.2;
          return (
            <line
              key={deg}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#F5E6C8"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* Wing hint */}
      <path
        d="M38 46L52 58L48 46H38Z"
        fill="#252525"
      />
    </svg>
  );
}

interface ArgentinaLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md";
}

export default function ArgentinaLogo({
  className,
  showText = true,
  size = "md",
}: ArgentinaLogoProps) {
  const iconClass =
    size === "sm" ? "h-9 w-12 shrink-0" : "h-11 w-[3.25rem] shrink-0 sm:h-12 sm:w-14";
  const textClass =
    size === "sm"
      ? "text-[13px] leading-[1.1]"
      : "text-[14px] leading-[1.08] sm:text-[17px]";

  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <AirplaneLogoMark className={iconClass} />
      {showText && (
        <span className={cn("font-sans font-bold tracking-tight text-sky", textClass)}>
          <span className="block">Пора</span>
          <span className="block">в Аргентину</span>
        </span>
      )}
    </span>
  );
}

export { AirplaneLogoMark };
