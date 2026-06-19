import {
  BookOpen,
  ClipboardList,
  CloudSun,
  Coins,
  Compass,
  Globe,
  Landmark,
  LayoutGrid,
  Map,
  MapPinned,
  MapPin,
  Plane,
  Shield,
  ShoppingBag,
  Train,
  Utensils,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import type { SiteNavLink } from "@/types/site-nav";

export const GUIDE_HUB_LINK_ID = "guide-all";
export const GUIDE_ABOUT_LINK_ID = "guide-about-argentina";

export const GUIDE_TOPIC_ICONS: Record<string, LucideIcon> = {
  "kak-dobratsya": Plane,
  "gde-zhit": MapPin,
  transport: Train,
  "turistskie-regiony": Map,
  dostoprimechatelnosti: Landmark,
  "pogoda-i-sezonnost": CloudSun,
  yazyk: Globe,
  kultura: BookOpen,
  istoriya: Landmark,
  kukhnya: Utensils,
  svyaz: Wifi,
  "ekonomika-i-dengi": Coins,
  shopping: ShoppingBag,
  bezopasnost: Shield,
};

/** Icons for sticky section-nav column headers (Практика / Путешествие / Страна). */
export const GUIDE_NAV_COLUMN_ICONS: Record<string, LucideIcon> = {
  "guide-practice": ClipboardList,
  "guide-travel": MapPinned,
  "guide-country": Landmark,
};

export function getGuideTopicIcon(slug: string): LucideIcon {
  return GUIDE_TOPIC_ICONS[slug] ?? BookOpen;
}

export function getGuideNavLinkIcon(link: SiteNavLink): LucideIcon {
  if (link.id === GUIDE_ABOUT_LINK_ID) return Compass;
  if (link.id === GUIDE_HUB_LINK_ID) return LayoutGrid;
  if (link.topicSlug) return getGuideTopicIcon(link.topicSlug);
  return BookOpen;
}

export function getGuideNavColumnIcon(columnId: string): LucideIcon {
  return GUIDE_NAV_COLUMN_ICONS[columnId] ?? Compass;
}
