import type { TripsterExperience, TripsterScheduleResponse } from "@/lib/tripster/types";
import type { PartnerTourExperienceRow } from "@/lib/tripster/partner-tour-mapper";

export const TRIPSTER_SCHEDULE_REGRESSION: TripsterScheduleResponse = {
  schedule: {
    "2026-09-01": [
      { time: "08:00", available_persons: 4 },
      { time: "14:00", available_persons: 2 },
    ],
    "2026-10-01": [{ time: "08:00", available_persons: 8 }],
  },
};

export const TRIPSTER_TREK_DIFFICULTY_EXPERIENCE: TripsterExperience = {
  id: 92278,
  type: "tour",
  format: "activity",
  max_persons: 12,
  duration: 312,
  plan_days_count: 14,
  comfort_level_info:
    "<div><p><strong>Уровень сложности.</strong> Трекинговый маршрут с несколькими продолжительными треккингами и набором высоты до 900 метров.</p></div>",
};

export const TRIPSTER_LISTING_ROW: PartnerTourExperienceRow = {
  id: 92278,
  slug: "patagonia-t92278",
  country_id: 65,
  city_id: 204,
  title: "Патагония",
  review_count: 12,
  duration_minutes: 312 * 60,
  experience_type: "tour",
  payload: {
    ...TRIPSTER_TREK_DIFFICULTY_EXPERIENCE,
    schedule_snapshot: TRIPSTER_SCHEDULE_REGRESSION,
  },
};

export const TRIPSTER_AFFILIATE_TRANSITION = {
  slug: "patagonia-t92278",
  startDate: "2026-09-01",
  time: "08:00",
  guests: 3,
  name: "Иван Иванов",
  email: "ivan@example.com",
  phone: "+79991234567",
};
