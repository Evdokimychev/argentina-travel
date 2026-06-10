import {
  BedDouble,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  FileText,
  Luggage,
  Map,
  MapPin,
  MessageSquare,
  Package,
  Route,
  Sparkles,
  Star,
  Truck,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export const TOUR_SECTION_ICONS: Record<string, LucideIcon> = {
  description: FileText,
  places: Sparkles,
  itinerary: Route,
  guides: UserRound,
  included: Package,
  accommodations: BedDouble,
  packing: Luggage,
  policies: ClipboardList,
  important: CircleHelp,
  "route-map": Map,
  logistics: Truck,
  faq: CircleHelp,
  dates: CalendarDays,
  organizer: UserRound,
  reviews: Star,
  similar: MapPin,
};

export function getTourSectionIcon(id: string): LucideIcon {
  return TOUR_SECTION_ICONS[id] ?? FileText;
}
