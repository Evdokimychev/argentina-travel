import {
  Baby,
  BookOpenCheck,
  CalendarClock,
  FileText,
  Globe2,
  Home,
  IdCard,
  Lightbulb,
  Link2,
  Plane,
  Stamp,
  type LucideIcon,
} from "lucide-react";

export const IMMIGRATION_HUB_LINK_ID = "immigration-all";

export const IMMIGRATION_NAV_ICONS: Record<string, LucideIcon> = {
  "immigration-all": BookOpenCheck,
  "immigration-life": Home,
  "immigration-process": Plane,
  "immigration-birth": Baby,
  "immigration-citizenship": Globe2,
  "immigration-residency": IdCard,
  "immigration-opportunities": Lightbulb,
  "immigration-links": Link2,
  "immigration-visas": Stamp,
  "immigration-residency-overview": IdCard,
  "immigration-documents": FileText,
  "immigration-extension": CalendarClock,
};

const IMMIGRATION_HUB_TOPIC_ICONS: Record<string, LucideIcon> = {
  "life-in-country": Home,
  "immigration-process": Plane,
  birth: Baby,
  citizenship: Globe2,
  residency: IdCard,
  opportunities: Lightbulb,
  "useful-links": Link2,
};

export function getImmigrationNavIcon(linkId: string): LucideIcon {
  return IMMIGRATION_NAV_ICONS[linkId] ?? FileText;
}

export function getImmigrationHubTopicIcon(topicId: string): LucideIcon {
  return IMMIGRATION_HUB_TOPIC_ICONS[topicId] ?? FileText;
}
