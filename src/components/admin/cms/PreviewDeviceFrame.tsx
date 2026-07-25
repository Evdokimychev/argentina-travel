"use client";

import type { ReactNode } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/cn";

export type PreviewViewport = "mobile" | "tablet" | "desktop";
export type PreviewTheme = "light" | "dark";

type PreviewDeviceFrameProps = {
  viewport: PreviewViewport;
  theme: PreviewTheme;
  onViewportChange: (viewport: PreviewViewport) => void;
  onThemeChange: (theme: PreviewTheme) => void;
  children: ReactNode;
  /** Extra class on the framed content surface. */
  contentClassName?: string;
  /** Optional controls rendered after theme/viewport selects. */
  extraControls?: ReactNode;
  className?: string;
};

export function PreviewDeviceControls({
  viewport,
  theme,
  onViewportChange,
  onThemeChange,
  extraControls,
  className,
}: Omit<PreviewDeviceFrameProps, "children" | "contentClassName">) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      <NativeSelect
        value={theme}
        onChange={(e) => onThemeChange(e.target.value as PreviewTheme)}
        aria-label="Тема предпросмотра"
      >
        <option value="light">Светлая</option>
        <option value="dark">Тёмная</option>
      </NativeSelect>
      <NativeSelect
        value={viewport}
        onChange={(e) => onViewportChange(e.target.value as PreviewViewport)}
        aria-label="Ширина предпросмотра"
      >
        <option value="mobile">390px · телефон</option>
        <option value="tablet">768px · планшет</option>
        <option value="desktop">1280px · десктоп</option>
      </NativeSelect>
      {extraControls}
    </div>
  );
}

/** Shared admin preview chrome: device width + light/dark surface. */
export default function PreviewDeviceFrame({
  viewport,
  theme,
  onViewportChange,
  onThemeChange,
  children,
  contentClassName,
  extraControls,
  className,
}: PreviewDeviceFrameProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <PreviewDeviceControls
        viewport={viewport}
        theme={theme}
        onViewportChange={onViewportChange}
        onThemeChange={onThemeChange}
        extraControls={extraControls}
      />
      <div
        className={cn(
          "mx-auto w-full overflow-hidden rounded-2xl border border-border-subtle",
          theme === "dark" ? "dark bg-charcoal text-white" : "bg-sand/40",
          viewport === "mobile" && "max-w-[390px]",
          viewport === "tablet" && "max-w-[768px]",
          viewport === "desktop" && "max-w-5xl",
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
