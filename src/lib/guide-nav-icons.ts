import {
  BookOpen,
  CloudSun,
  Coins,
  Globe,
  Landmark,
  Map,
  MapPin,
  Plane,
  Shield,
  ShoppingBag,
  Train,
  Utensils,
  Wifi,
  type LucideIcon,
} from "lucide-react";

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

export function getGuideTopicIcon(slug: string): LucideIcon {
  return GUIDE_TOPIC_ICONS[slug] ?? BookOpen;
}
