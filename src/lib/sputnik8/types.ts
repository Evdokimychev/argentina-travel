export type Sputnik8Country = {
  id: number;
  name?: string;
  name_ru?: string;
  name_en?: string;
  slug?: string;
  currency?: string;
  products_count?: number;
  cities_count?: number;
};

export type Sputnik8City = {
  id: number;
  name?: string;
  name_ru?: string;
  name_en?: string;
  slug?: string;
  country_id?: number;
  country?: Sputnik8Country;
  products_count?: number;
  photo_url?: string;
  image_url?: string;
  cover_image?: string;
};

export type Sputnik8Photo = {
  id?: number;
  url?: string;
  thumbnail?: string;
  medium?: string;
  original?: string;
  photo_url?: string;
  big?: string;
  small?: string;
};

export type Sputnik8CoverPhoto = {
  big?: string;
  medium?: string;
  small?: string;
};

export type Sputnik8Price = {
  value?: number;
  currency?: string;
  price_from?: boolean;
  value_string?: string;
  price_description?: string;
  per_person?: Array<{
    id: number;
    title?: string;
    is_default?: boolean;
    value?: number;
  }>;
};

export type Sputnik8BasePrice = {
  price?: string;
  currency?: string;
  value?: number;
};

export type Sputnik8OrderLine = {
  id?: number;
  title?: string;
  name?: string;
  price?: string | number;
  currency?: string;
  is_default?: boolean;
  all_prices?: Array<{
    price?: string | number;
    currency?: string;
    value?: number;
  }>;
};

export type Sputnik8Guide = {
  id?: number | string;
  name?: string;
  first_name?: string;
  avatar_url?: string;
  photo_url?: string;
  photo?: string;
  link?: string;
  url?: string;
  rating?: number;
  review_count?: number;
};

export type Sputnik8LocationPoint = {
  text?: string;
  address?: string;
  description?: string;
  lat?: number;
  lng?: number;
};

export type Sputnik8Product = {
  id: number;
  name?: string;
  title?: string;
  short_description?: string;
  tagline?: string;
  annotation?: string;
  description?: string;
  url?: string;
  status?: string;
  activity_type?: string;
  type?: string;
  format?: string;
  duration?: number | string;
  duration_hours?: number;
  duration_minutes?: number;
  rating?: number;
  reviews_count?: number;
  review_count?: number;
  price?: Sputnik8Price | number | string;
  base_price?: Sputnik8BasePrice;
  currency?: string;
  city_id?: number;
  city?: Sputnik8City;
  photos?: Sputnik8Photo[];
  images?: Sputnik8Photo[];
  cover_photo?: Sputnik8CoverPhoto;
  main_photo?: string;
  image_big?: string;
  image_small?: string;
  guide?: Sputnik8Guide;
  host?: Sputnik8Guide;
  max_persons?: number;
  child_friendly?: boolean;
  instant_booking?: boolean;
  is_bookable?: boolean;
  movement_type?: string;
  transport_type?: string;
  meeting_point?: string | Sputnik8LocationPoint;
  begin_place?: Sputnik8LocationPoint;
  finish_point?: string | Sputnik8LocationPoint;
  price_included_description?: string;
  price_not_included_description?: string;
  what_included?: string | string[];
  what_not_included?: string | string[];
  included?: string;
  not_included?: string;
  places_to_see?: string;
  description_blocks?: Array<[string, string] | { title?: string; html?: string; content?: string }>;
  tags?: Array<{ id: number; name?: string; title?: string; url?: string }>;
  categories?: Array<{ id: number; name?: string; title?: string }>;
  languages?: string[] | string;
  pay_type_in_text?: string;
  minimum_book_period?: string | number;
  order_options?: Sputnik8OrderOption[];
};

export type Sputnik8Event = {
  id: number;
  product_id?: number;
  date?: string;
  time?: string;
  datetime?: string;
  starts_at?: string;
  ends_at?: string;
  available?: boolean;
  is_available?: boolean;
  max_persons?: number;
  price?: Sputnik8Price | number;
};

export type Sputnik8OrderOption = {
  id: number;
  title?: string;
  name?: string;
  price?: number | string;
  currency?: string;
  is_default?: boolean;
  min_quantity?: number;
  max_quantity?: number;
  order_lines?: Sputnik8OrderLine[];
};

export type Sputnik8Review = {
  id: number;
  rating?: number;
  text?: string;
  content?: string;
  author_name?: string;
  name?: string;
  created_at?: string;
  date?: string;
  photos?: string[];
};

export type Sputnik8OrderRequest = {
  event_id: number;
  name: string;
  email: string;
  phone: string;
  persons_count: number;
  comment?: string;
  order_options?: Array<{ id: number; quantity: number }>;
};

export type Sputnik8OrderResponse = {
  id: number;
  status?: string;
  url?: string;
  payment_url?: string;
  price?: Sputnik8Price | number;
};

export type Sputnik8ProductListParams = {
  cityId?: number;
  limit?: number;
  lang?: string;
  currency?: string;
  order?: string;
  orderType?: string;
  page?: number;
};

export type Sputnik8Paginated<T> = {
  products?: T[];
  cities?: T[];
  countries?: T[];
  events?: T[];
  reviews?: T[];
  data?: T[];
  results?: T[];
  total?: number;
  count?: number;
};
