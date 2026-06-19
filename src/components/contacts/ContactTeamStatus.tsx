"use client";

import { useEffect, useState } from "react";
import { Moon, Radio } from "lucide-react";
import { getSiteTeamAvailability } from "@/lib/site-working-hours";
import { cn } from "@/lib/cn";

export default function ContactTeamStatus({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [availability, setAvailability] = useState(() => getSiteTeamAvailability());

  useEffect(() => {
    const refresh = () => setAvailability(getSiteTeamAvailability());
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className={cn(
        tone === "light" ? "mt-3 border-t border-gray-100 pt-3" : "border-0 pt-0",
        availability.online
          ? tone === "dark"
            ? "text-emerald-200"
            : "text-emerald-800"
          : tone === "dark"
            ? "text-white"
            : "text-charcoal"
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
            availability.online
              ? tone === "dark"
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-emerald-100 text-emerald-600"
              : tone === "dark"
                ? "bg-white/10 text-white/80"
                : "bg-gray-100 text-slate"
          )}
          aria-hidden
        >
          {availability.online ? (
            <Radio className="h-3 w-3" strokeWidth={2.25} />
          ) : (
            <Moon className="h-3 w-3" strokeWidth={2.25} />
          )}
        </span>
        <div className="min-w-0 text-sm leading-snug">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium">
            <span>{availability.title}</span>
            {availability.online ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-normal",
                  tone === "dark" ? "text-emerald-300" : "text-emerald-700"
                )}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                онлайн
              </span>
            ) : null}
          </p>
          <p className={cn("mt-0.5", tone === "dark" ? "text-white/75" : "text-slate")}>
            {availability.description}
          </p>
        </div>
      </div>
    </div>
  );
}
