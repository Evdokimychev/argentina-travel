export type TripsterPaginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type TripsterCountry = {
  id: number;
  name_ru?: string;
  name_en?: string;
  slug?: string;
  currency?: string;
  experience_count?: number;
  tours_count?: number;
  url?: string;
  region?: string;
};

export type TripsterCity = {
  id: number;
  name_ru?: string;
  name_en?: string;
  slug?: string;
  iata?: string;
  experience_count?: number;
  tours_count?: number;
  guides_count?: number;
  url?: string;
  country?: TripsterCountry;
  image?: {
    thumbnail?: string;
    cover?: string;
  };
};

export type TripsterPhoto = {
  thumbnail?: string;
  medium?: string;
  type?: string;
};

export type TripsterPrice = {
  value?: number;
  currency?: string;
  currency_rate?: number;
  price_from?: boolean;
  unit_string?: string;
  value_string?: string;
  price_description?: string;
  onsite_payment?: number;
  per_group?: { value?: number };
  per_person?: Array<{
    id: number;
    title?: string;
    is_default?: boolean;
    value?: number;
    option_id?: string;
  }>;
  discount?: {
    value?: number;
    expiration_date?: string;
    expiration_text?: string;
    original_price?: number;
  } | null;
};

export type TripsterGuide = {
  id: number;
  first_name?: string;
  url?: string;
  avatar?: {
    thumbnail?: string;
    medium?: string;
    small?: string;
    original?: string;
  };
};

export type TripsterLocationPoint = {
  text?: string | null;
  address?: string | null;
  description?: string | null;
};

export type TripsterExperience = {
  id: number;
  title?: string;
  tagline?: string;
  annotation?: string;
  description?: string;
  url?: string;
  status?: string;
  type?: string;
  format?: string;
  movement_type?: string;
  schedule_type?: string;
  instant_booking?: boolean;
  child_friendly?: boolean;
  max_persons?: number;
  duration?: number;
  review_count?: number;
  rating?: number;
  popularity?: number;
  is_bookable?: boolean;
  is_new?: boolean;
  is_visible?: boolean;
  visitors_count?: number;
  cover_image?: string;
  comfort_level_info?: string;
  price_included_description?: string;
  price_not_included_description?: string;
  description_blocks?: Array<[string, string] | string[]>;
  meeting_point?: TripsterLocationPoint;
  finish_point?: TripsterLocationPoint;
  guide?: TripsterGuide;
  price?: TripsterPrice;
  city?: TripsterCity;
  photos?: TripsterPhoto[];
  tags?: Array<{ id: number; name?: string; experience_count?: number; url?: string }>;
  links?: {
    reviews?: string;
    schedule?: string;
  };
  geo?: {
    country?: Array<{ id: number; slug?: string; name?: string }>;
    city?: Array<{ id: number; slug?: string; name?: string }>;
  };
  schedule?: { text?: string | null };
};

export type TripsterReview = {
  id?: number;
  rating?: number;
  text?: string;
  created_at?: string;
  author?: {
    name?: string;
    avatar?: string;
  };
};

export type TripsterExperienceListParams = {
  city?: number;
  country?: number;
  countrySlug?: string;
  citySlug?: string;
  page?: number;
  pageSize?: number;
  detailed?: boolean;
  priceFormat?: "detailed";
  updatedAfter?: string;
  search?: string;
};

export type TripsterObtainTokenResponse = {
  token: string;
};

export type TripsterScheduleSlot = {
  type?: string;
  time_start?: string;
  time_end?: string;
  price?: {
    price_text?: string;
    price_value?: number;
    is_decreased?: boolean;
    is_increased?: boolean;
  };
};

export type TripsterScheduleResponse = {
  timezone?: string;
  begin?: string;
  end?: string;
  defaults?: {
    closes_before?: number;
    available_persons?: number;
    duration?: number;
  };
  schedule?: Record<string, TripsterScheduleSlot[]>;
};

export type TripsterPriceQuote = {
  value?: number;
  pre_pay?: number;
  payment_to_guide?: number;
  per_ticket?: Array<{
    id: number;
    title?: string;
    count?: number;
    price?: number;
    price_without_tripster_discount?: number;
  }>;
  currency?: string;
  currency_rate?: number;
  value_string?: string;
  price_description?: string;
};

export type TripsterExternalOrderRequest = {
  experience: number;
  persons_count: number;
  date: string;
  time: string;
  tickets?: Array<{ id: number; count: number }>;
  name: string;
  email: string;
  phone: string;
  message_to_guide?: string;
};

export type TripsterExternalOrderResponse = {
  id: number;
  status: string;
  url?: string;
  price?: TripsterPriceQuote;
  event?: { date?: string; time?: string };
  experience?: { id: number; title?: string };
  traveler?: { name?: string; phone?: string; email?: string };
  message_to_guide?: string;
};
