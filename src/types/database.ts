export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ContactSubmissionKind =
  | "general"
  | "tour_inquiry"
  | "service_request"
  | "product_inquiry"
  | "organizer_application"
  | "consultation";

export type NewsletterSubscriberStatus = "active" | "unsubscribed";

export type AccountRoleDb = "tourist" | "organizer" | "admin";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          email: string | null;
          avatar_url: string | null;
          country: string;
          date_of_birth: string | null;
          roles: AccountRoleDb[];
          active_role: AccountRoleDb;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          country?: string;
          date_of_birth?: string | null;
          roles?: AccountRoleDb[];
          active_role?: AccountRoleDb;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          country?: string;
          date_of_birth?: string | null;
          roles?: AccountRoleDb[];
          active_role?: AccountRoleDb;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          user_id: string | null;
          guest_user_id: string | null;
          organizer_user_id: string | null;
          tour_id: string;
          tour_slug: string;
          tour_title: string;
          tour_image: string;
          status: string;
          guests: number;
          total_price_usd: number;
          contact_name: string;
          contact_email: string;
          contact_phone: string;
          start_date: string | null;
          end_date: string | null;
          payment_status: string | null;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id?: string | null;
          guest_user_id?: string | null;
          organizer_user_id?: string | null;
          tour_id: string;
          tour_slug: string;
          tour_title: string;
          tour_image?: string;
          status?: string;
          guests?: number;
          total_price_usd?: number;
          contact_name?: string;
          contact_email: string;
          contact_phone?: string;
          start_date?: string | null;
          end_date?: string | null;
          payment_status?: string | null;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          guest_user_id?: string | null;
          organizer_user_id?: string | null;
          tour_id?: string;
          tour_slug?: string;
          tour_title?: string;
          tour_image?: string;
          status?: string;
          guests?: number;
          total_price_usd?: number;
          contact_name?: string;
          contact_email?: string;
          contact_phone?: string;
          start_date?: string | null;
          end_date?: string | null;
          payment_status?: string | null;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      shop_orders: {
        Row: {
          id: string;
          user_id: string | null;
          guest_email: string | null;
          product_id: string;
          product_slug: string;
          product_title: string;
          price_usd: number;
          currency: string;
          status: string;
          payment_status: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          delivery_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id?: string | null;
          guest_email?: string | null;
          product_id: string;
          product_slug: string;
          product_title: string;
          price_usd?: number;
          currency?: string;
          status?: string;
          payment_status?: string;
          customer_name?: string;
          customer_email: string;
          customer_phone?: string;
          delivery_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          guest_email?: string | null;
          product_id?: string;
          product_slug?: string;
          product_title?: string;
          price_usd?: number;
          currency?: string;
          status?: string;
          payment_status?: string;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          delivery_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          locale: string | null;
          source: string;
          status: NewsletterSubscriberStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          locale?: string | null;
          source?: string;
          status?: NewsletterSubscriberStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          locale?: string | null;
          source?: string;
          status?: NewsletterSubscriberStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      contact_submissions: {
        Row: {
          id: string;
          kind: ContactSubmissionKind;
          name: string;
          email: string | null;
          phone: string | null;
          message: string;
          context: Json;
          page_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          kind: ContactSubmissionKind;
          name: string;
          email?: string | null;
          phone?: string | null;
          message?: string;
          context?: Json;
          page_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          kind?: ContactSubmissionKind;
          name?: string;
          email?: string | null;
          phone?: string | null;
          message?: string;
          context?: Json;
          page_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
export type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];
export type ShopOrderRow = Database["public"]["Tables"]["shop_orders"]["Row"];
export type ShopOrderInsert = Database["public"]["Tables"]["shop_orders"]["Insert"];
export type ShopOrderUpdate = Database["public"]["Tables"]["shop_orders"]["Update"];

export type NewsletterSubscriber =
  Database["public"]["Tables"]["newsletter_subscribers"]["Row"];
export type ContactSubmission = Database["public"]["Tables"]["contact_submissions"]["Row"];
export type ContactSubmissionInsert =
  Database["public"]["Tables"]["contact_submissions"]["Insert"];
export type NewsletterSubscriberInsert =
  Database["public"]["Tables"]["newsletter_subscribers"]["Insert"];
