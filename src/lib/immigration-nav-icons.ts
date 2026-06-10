import {
  BookOpenCheck,
  CalendarClock,
  FileText,
  IdCard,
  Stamp,
  type LucideIcon,
} from "lucide-react";

export const IMMIGRATION_NAV_ICONS: Record<string, LucideIcon> = {
  "immigration-all": BookOpenCheck,
  "immigration-visas": Stamp,
  "immigration-residency": IdCard,
  "immigration-documents": FileText,
  "immigration-extension": CalendarClock,
};

export function getImmigrationNavIcon(linkId: string): LucideIcon {
  return IMMIGRATION_NAV_ICONS[linkId] ?? FileText;
}
