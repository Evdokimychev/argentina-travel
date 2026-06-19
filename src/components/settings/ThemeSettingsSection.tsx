"use client";

import ThemeToggle from "@/components/ThemeToggle";
import { cabinetPanelClass, cabinetPageSubtitleClass } from "@/lib/cabinet-ui";
import { cn } from "@/lib/cn";
import { DARK_THEME_ENABLED } from "@/types/theme";

interface ThemeSettingsSectionProps {
  className?: string;
  title?: string;
  description?: string;
}

export default function ThemeSettingsSection({
  className,
  title = "Тема оформления",
  description = "Выберите светлую или тёмную тему для шапки, меню и личного кабинета.",
}: ThemeSettingsSectionProps) {
  if (!DARK_THEME_ENABLED) return null;

  return (
    <section className={cn(cabinetPanelClass, className)}>
      <h2 className="font-heading text-lg font-bold text-foreground">{title}</h2>
      <p className={cabinetPageSubtitleClass}>{description}</p>
      <ThemeToggle variant="settings" className="mt-4" />
    </section>
  );
}
