import { EKONOMIKA_PILLAR } from "@/data/guide-pillar-ekonomika";
import { KAK_DOBRATSYA_PILLAR, TRANSPORT_PILLAR } from "@/data/guide-pillars/travel-logistics";
import { GDE_ZHIT_PILLAR } from "@/data/guide-pillar-gde-zhit";
import {
  TURISTICSKIE_REGIONY_PILLAR,
  DOSTOPRIMECHATELNOSTI_PILLAR,
  POGODA_PILLAR,
} from "@/data/guide-pillars/regions-sights";
import {
  YAZYK_PILLAR,
  KULTURA_PILLAR,
  ISTORIYA_PILLAR,
  KUHNYA_PILLAR,
} from "@/data/guide-pillars/culture-life";
import { SVYAZ_PILLAR } from "@/data/guide-pillar-svyaz";
import { BEZOPASNOST_PILLAR } from "@/data/guide-pillar-bezopasnost";
import { SHOPPING_PILLAR } from "@/data/guide-pillars/practical";
import type { GuidePillarContent } from "@/types/guide-pillar";

export const GUIDE_PILLARS: Record<string, GuidePillarContent> = {
  "kak-dobratsya": KAK_DOBRATSYA_PILLAR,
  "gde-zhit": GDE_ZHIT_PILLAR,
  transport: TRANSPORT_PILLAR,
  "turistskie-regiony": TURISTICSKIE_REGIONY_PILLAR,
  dostoprimechatelnosti: DOSTOPRIMECHATELNOSTI_PILLAR,
  "pogoda-i-sezonnost": POGODA_PILLAR,
  yazyk: YAZYK_PILLAR,
  kultura: KULTURA_PILLAR,
  istoriya: ISTORIYA_PILLAR,
  kukhnya: KUHNYA_PILLAR,
  svyaz: SVYAZ_PILLAR,
  "ekonomika-i-dengi": EKONOMIKA_PILLAR,
  shopping: SHOPPING_PILLAR,
  bezopasnost: BEZOPASNOST_PILLAR,
};

export function getGuidePillarBySlug(slug: string): GuidePillarContent | undefined {
  return GUIDE_PILLARS[slug];
}
