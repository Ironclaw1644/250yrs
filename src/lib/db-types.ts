/** Hand-authored row types for the `taw` schema (tables we read on the public site). */

export type ListingStatus =
  | "draft"
  | "pending"
  | "published"
  | "suspended"
  | "archived";

export interface Country {
  id: string;
  code: string;
  name: string;
  slug: string;
}

export interface State {
  id: string;
  country_id: string;
  code: string | null;
  name: string;
  slug: string;
}

export interface City {
  id: string;
  state_id: string;
  name: string;
  slug: string;
  lat: number | null;
  lng: number | null;
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
}

export interface Business {
  id: string;
  owner_id: string | null;
  city_id: string;
  category_id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  lat: number | null;
  lng: number | null;
  status: ListingStatus;
  plan_tier: "free" | "monthly" | "annual";
  featured_city: boolean;
  featured_state: boolean;
  is_demo: boolean;
  rating_avg: number;
  rating_count: number;
  published_at: string | null;
}

export interface BusinessHour {
  id: string;
  business_id: string;
  day_of_week: number; // 0 = Sunday
  open_time: string | null; // "HH:MM:SS"
  close_time: string | null;
  is_closed: boolean;
}

export interface BusinessPhoto {
  id: string;
  business_id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  is_demo: boolean;
  sort_order: number;
}

export interface MenuSection {
  id: string;
  business_id: string;
  name: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  section_id: string;
  business_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  sort_order: number;
}

export interface Review {
  id: string;
  business_id: string;
  author_id: string;
  rating: number;
  body: string | null;
  response_body: string | null;
  response_at: string | null;
  created_at: string;
}
