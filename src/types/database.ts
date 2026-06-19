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
          is_blocked: boolean;
          organizer_verified_at: string | null;
          admin_notes: string | null;
          deleted_at: string | null;
          anonymized_at: string | null;
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
          is_blocked?: boolean;
          organizer_verified_at?: string | null;
          admin_notes?: string | null;
          deleted_at?: string | null;
          anonymized_at?: string | null;
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
          is_blocked?: boolean;
          organizer_verified_at?: string | null;
          admin_notes?: string | null;
          deleted_at?: string | null;
          anonymized_at?: string | null;
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
      booking_attribution: {
        Row: {
          booking_id: string;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          referrer: string | null;
          landing_path: string | null;
          api_key_id: string | null;
          created_at: string;
        };
        Insert: {
          booking_id: string;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          referrer?: string | null;
          landing_path?: string | null;
          api_key_id?: string | null;
          created_at?: string;
        };
        Update: {
          booking_id?: string;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          referrer?: string | null;
          landing_path?: string | null;
          api_key_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_attribution_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: true;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_attribution_api_key_id_fkey";
            columns: ["api_key_id"];
            isOneToOne: false;
            referencedRelation: "api_keys";
            referencedColumns: ["id"];
          },
        ];
      };
      conversation_threads: {
        Row: {
          id: string;
          booking_id: string | null;
          expert_inquiry_id: string | null;
          tourist_user_id: string;
          organizer_user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id?: string | null;
          expert_inquiry_id?: string | null;
          tourist_user_id: string;
          organizer_user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string | null;
          expert_inquiry_id?: string | null;
          tourist_user_id?: string;
          organizer_user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      local_experts: {
        Row: {
          id: string;
          slug: string;
          name: string;
          bio: string;
          city: string;
          categories: string[];
          languages: string[];
          avatar_url: string | null;
          contact_mode: string;
          user_id: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          bio?: string;
          city: string;
          categories?: string[];
          languages?: string[];
          avatar_url?: string | null;
          contact_mode?: string;
          user_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          bio?: string;
          city?: string;
          categories?: string[];
          languages?: string[];
          avatar_url?: string | null;
          contact_mode?: string;
          user_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      expert_inquiries: {
        Row: {
          id: string;
          expert_id: string;
          user_id: string;
          message: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          expert_id: string;
          user_id: string;
          message: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          expert_id?: string;
          user_id?: string;
          message?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expert_inquiries_expert_id_fkey";
            columns: ["expert_id"];
            isOneToOne: false;
            referencedRelation: "local_experts";
            referencedColumns: ["id"];
          },
        ];
      };
      conversation_messages: {
        Row: {
          id: string;
          thread_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          sender_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          sender_id?: string;
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      message_reads: {
        Row: {
          user_id: string;
          message_id: string;
          read_at: string;
        };
        Insert: {
          user_id: string;
          message_id: string;
          read_at?: string;
        };
        Update: {
          user_id?: string;
          message_id?: string;
          read_at?: string;
        };
        Relationships: [];
      };
      typing_presence: {
        Row: {
          thread_id: string;
          user_id: string;
          updated_at: string;
        };
        Insert: {
          thread_id: string;
          user_id: string;
          updated_at?: string;
        };
        Update: {
          thread_id?: string;
          user_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tourist_reviews: {
        Row: {
          id: string;
          user_id: string | null;
          organizer_user_id: string | null;
          organizer_tour_id: string | null;
          organizer_reply: string | null;
          organizer_replied_at: string | null;
          organizer_replied_by: string | null;
          tour_id: string;
          tour_slug: string;
          tour_title: string;
          booking_id: string | null;
          listing_kind: string;
          rating: number;
          review_text: string;
          photos: Json;
          trip_date: string | null;
          status: string;
          moderation_notes: string | null;
          moderated_by: string | null;
          moderated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id?: string | null;
          organizer_user_id?: string | null;
          organizer_tour_id?: string | null;
          organizer_reply?: string | null;
          organizer_replied_at?: string | null;
          organizer_replied_by?: string | null;
          tour_id: string;
          tour_slug: string;
          tour_title: string;
          booking_id?: string | null;
          listing_kind?: string;
          rating: number;
          review_text?: string;
          photos?: Json;
          trip_date?: string | null;
          status?: string;
          moderation_notes?: string | null;
          moderated_by?: string | null;
          moderated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          organizer_user_id?: string | null;
          organizer_tour_id?: string | null;
          organizer_reply?: string | null;
          organizer_replied_at?: string | null;
          organizer_replied_by?: string | null;
          tour_id?: string;
          tour_slug?: string;
          tour_title?: string;
          booking_id?: string | null;
          listing_kind?: string;
          rating?: number;
          review_text?: string;
          photos?: Json;
          trip_date?: string | null;
          status?: string;
          moderation_notes?: string | null;
          moderated_by?: string | null;
          moderated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      review_reports: {
        Row: {
          id: string;
          review_id: string;
          reporter_user_id: string | null;
          reason: string;
          details: string | null;
          status: string;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          reporter_user_id?: string | null;
          reason: string;
          details?: string | null;
          status?: string;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          reporter_user_id?: string | null;
          reason?: string;
          details?: string | null;
          status?: string;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tours: {
        Row: {
          id: string;
          slug: string;
          owner_user_id: string;
          status: string;
          title: string;
          listing: Json | null;
          payload: Json;
          published_at: string | null;
          moderation_status: string;
          moderation_notes: string | null;
          moderated_by: string | null;
          moderated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          owner_user_id: string;
          status?: string;
          title: string;
          listing?: Json | null;
          payload: Json;
          published_at?: string | null;
          moderation_status?: string;
          moderation_notes?: string | null;
          moderated_by?: string | null;
          moderated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          owner_user_id?: string;
          status?: string;
          title?: string;
          listing?: Json | null;
          payload?: Json;
          published_at?: string | null;
          moderation_status?: string;
          moderation_notes?: string | null;
          moderated_by?: string | null;
          moderated_at?: string | null;
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
      tripster_countries: {
        Row: {
          id: number;
          slug: string | null;
          name_ru: string | null;
          name_en: string | null;
          currency: string | null;
          experience_count: number;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: number;
          slug?: string | null;
          name_ru?: string | null;
          name_en?: string | null;
          currency?: string | null;
          experience_count?: number;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          slug?: string | null;
          name_ru?: string | null;
          name_en?: string | null;
          currency?: string | null;
          experience_count?: number;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tripster_cities: {
        Row: {
          id: number;
          country_id: number;
          slug: string;
          name_ru: string | null;
          name_en: string | null;
          experience_count: number;
          cover_image: string | null;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: number;
          country_id: number;
          slug: string;
          name_ru?: string | null;
          name_en?: string | null;
          experience_count?: number;
          cover_image?: string | null;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          country_id?: number;
          slug?: string;
          name_ru?: string | null;
          name_en?: string | null;
          experience_count?: number;
          cover_image?: string | null;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tripster_experiences: {
        Row: {
          id: number;
          slug: string;
          country_id: number;
          city_id: number;
          title: string;
          tagline: string | null;
          annotation: string | null;
          description: string | null;
          status: string | null;
          experience_type: string | null;
          format: string | null;
          duration_minutes: number | null;
          rating: number | null;
          review_count: number;
          price_value: number | null;
          price_currency: string | null;
          price_display: string | null;
          tripster_url: string;
          partner_url: string | null;
          cover_image: string | null;
          photos: Json;
          payload: Json;
          synced_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: number;
          slug: string;
          country_id: number;
          city_id: number;
          title: string;
          tagline?: string | null;
          annotation?: string | null;
          description?: string | null;
          status?: string | null;
          experience_type?: string | null;
          format?: string | null;
          duration_minutes?: number | null;
          rating?: number | null;
          review_count?: number;
          price_value?: number | null;
          price_currency?: string | null;
          price_display?: string | null;
          tripster_url: string;
          partner_url?: string | null;
          cover_image?: string | null;
          photos?: Json;
          payload?: Json;
          synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          slug?: string;
          country_id?: number;
          city_id?: number;
          title?: string;
          tagline?: string | null;
          annotation?: string | null;
          description?: string | null;
          status?: string | null;
          experience_type?: string | null;
          format?: string | null;
          duration_minutes?: number | null;
          rating?: number | null;
          review_count?: number;
          price_value?: number | null;
          price_currency?: string | null;
          price_display?: string | null;
          tripster_url?: string;
          partner_url?: string | null;
          cover_image?: string | null;
          photos?: Json;
          payload?: Json;
          synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tripster_reviews: {
        Row: {
          id: number;
          experience_id: number;
          rating: number | null;
          author_name: string | null;
          review_text: string | null;
          created_at: string | null;
          payload: Json;
          synced_at: string;
        };
        Insert: {
          id: number;
          experience_id: number;
          rating?: number | null;
          author_name?: string | null;
          review_text?: string | null;
          created_at?: string | null;
          payload?: Json;
          synced_at?: string;
        };
        Update: {
          id?: number;
          experience_id?: number;
          rating?: number | null;
          author_name?: string | null;
          review_text?: string | null;
          created_at?: string | null;
          payload?: Json;
          synced_at?: string;
        };
        Relationships: [];
      };
      tripster_sync_runs: {
        Row: {
          id: string;
          status: string;
          started_at: string;
          finished_at: string | null;
          cities_synced: number;
          experiences_synced: number;
          experiences_created: number;
          experiences_updated: number;
          error_message: string | null;
          log: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          status?: string;
          started_at?: string;
          finished_at?: string | null;
          cities_synced?: number;
          experiences_synced?: number;
          experiences_created?: number;
          experiences_updated?: number;
          error_message?: string | null;
          log?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          status?: string;
          started_at?: string;
          finished_at?: string | null;
          cities_synced?: number;
          experiences_synced?: number;
          experiences_created?: number;
          experiences_updated?: number;
          error_message?: string | null;
          log?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      sputnik8_countries: {
        Row: {
          id: number;
          slug: string | null;
          name_ru: string | null;
          name_en: string | null;
          currency: string | null;
          experience_count: number;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: number;
          slug?: string | null;
          name_ru?: string | null;
          name_en?: string | null;
          currency?: string | null;
          experience_count?: number;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          slug?: string | null;
          name_ru?: string | null;
          name_en?: string | null;
          currency?: string | null;
          experience_count?: number;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sputnik8_cities: {
        Row: {
          id: number;
          country_id: number;
          slug: string;
          name_ru: string | null;
          name_en: string | null;
          experience_count: number;
          cover_image: string | null;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: number;
          country_id: number;
          slug: string;
          name_ru?: string | null;
          name_en?: string | null;
          experience_count?: number;
          cover_image?: string | null;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          country_id?: number;
          slug?: string;
          name_ru?: string | null;
          name_en?: string | null;
          experience_count?: number;
          cover_image?: string | null;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sputnik8_products: {
        Row: {
          id: number;
          slug: string;
          country_id: number;
          city_id: number;
          title: string;
          tagline: string | null;
          annotation: string | null;
          description: string | null;
          status: string | null;
          experience_type: string | null;
          format: string | null;
          duration_minutes: number | null;
          rating: number | null;
          review_count: number;
          price_value: number | null;
          price_currency: string | null;
          price_display: string | null;
          sputnik8_url: string;
          partner_url: string | null;
          cover_image: string | null;
          photos: Json;
          payload: Json;
          synced_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: number;
          slug: string;
          country_id: number;
          city_id: number;
          title: string;
          tagline?: string | null;
          annotation?: string | null;
          description?: string | null;
          status?: string | null;
          experience_type?: string | null;
          format?: string | null;
          duration_minutes?: number | null;
          rating?: number | null;
          review_count?: number;
          price_value?: number | null;
          price_currency?: string | null;
          price_display?: string | null;
          sputnik8_url: string;
          partner_url?: string | null;
          cover_image?: string | null;
          photos?: Json;
          payload?: Json;
          synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          slug?: string;
          country_id?: number;
          city_id?: number;
          title?: string;
          tagline?: string | null;
          annotation?: string | null;
          description?: string | null;
          status?: string | null;
          experience_type?: string | null;
          format?: string | null;
          duration_minutes?: number | null;
          rating?: number | null;
          review_count?: number;
          price_value?: number | null;
          price_currency?: string | null;
          price_display?: string | null;
          sputnik8_url?: string;
          partner_url?: string | null;
          cover_image?: string | null;
          photos?: Json;
          payload?: Json;
          synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sputnik8_reviews: {
        Row: {
          id: number;
          product_id: number;
          rating: number | null;
          author_name: string | null;
          review_text: string | null;
          created_at: string | null;
          payload: Json;
          synced_at: string;
        };
        Insert: {
          id: number;
          product_id: number;
          rating?: number | null;
          author_name?: string | null;
          review_text?: string | null;
          created_at?: string | null;
          payload?: Json;
          synced_at?: string;
        };
        Update: {
          id?: number;
          product_id?: number;
          rating?: number | null;
          author_name?: string | null;
          review_text?: string | null;
          created_at?: string | null;
          payload?: Json;
          synced_at?: string;
        };
        Relationships: [];
      };
      sputnik8_sync_runs: {
        Row: {
          id: string;
          status: string;
          started_at: string;
          finished_at: string | null;
          cities_synced: number;
          experiences_synced: number;
          experiences_created: number;
          experiences_updated: number;
          error_message: string | null;
          log: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          status?: string;
          started_at?: string;
          finished_at?: string | null;
          cities_synced?: number;
          experiences_synced?: number;
          experiences_created?: number;
          experiences_updated?: number;
          error_message?: string | null;
          log?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          status?: string;
          started_at?: string;
          finished_at?: string | null;
          cities_synced?: number;
          experiences_synced?: number;
          experiences_created?: number;
          experiences_updated?: number;
          error_message?: string | null;
          log?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      sputnik8_booking_requests: {
        Row: {
          id: string;
          product_id: number | null;
          product_slug: string;
          user_id: string | null;
          event_id: number | null;
          event_date: string | null;
          event_time: string | null;
          persons_count: number;
          customer_name: string | null;
          customer_email: string | null;
          customer_phone: string | null;
          comment: string | null;
          sputnik8_order_id: number | null;
          sputnik8_order_url: string | null;
          sputnik8_status: string | null;
          price_snapshot: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id?: number | null;
          product_slug: string;
          user_id?: string | null;
          event_id?: number | null;
          event_date?: string | null;
          event_time?: string | null;
          persons_count?: number;
          customer_name?: string | null;
          customer_email?: string | null;
          customer_phone?: string | null;
          comment?: string | null;
          sputnik8_order_id?: number | null;
          sputnik8_order_url?: string | null;
          sputnik8_status?: string | null;
          price_snapshot?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: number | null;
          product_slug?: string;
          user_id?: string | null;
          event_id?: number | null;
          event_date?: string | null;
          event_time?: string | null;
          persons_count?: number;
          customer_name?: string | null;
          customer_email?: string | null;
          customer_phone?: string | null;
          comment?: string | null;
          sputnik8_order_id?: number | null;
          sputnik8_order_url?: string | null;
          sputnik8_status?: string | null;
          price_snapshot?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      affiliate_link_clicks: {
        Row: {
          id: string;
          experience_id: number | null;
          experience_slug: string;
          partner_url: string;
          referer: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          experience_id?: number | null;
          experience_slug: string;
          partner_url: string;
          referer?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          experience_id?: number | null;
          experience_slug?: string;
          partner_url?: string;
          referer?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      organizer_inbox_reads: {
        Row: {
          user_id: string;
          item_key: string;
          read_at: string;
        };
        Insert: {
          user_id: string;
          item_key: string;
          read_at?: string;
        };
        Update: {
          user_id?: string;
          item_key?: string;
          read_at?: string;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          user_id: string;
          channel: string;
          category: string;
          enabled: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          channel: string;
          category: string;
          enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          channel?: string;
          category?: string;
          enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_events: {
        Row: {
          id: string;
          user_id: string;
          dedupe_key: string;
          event_type: string;
          category: string;
          channel: string;
          title: string;
          body: string;
          href: string | null;
          read_at: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          dedupe_key: string;
          event_type: string;
          category: string;
          channel: string;
          title: string;
          body: string;
          href?: string | null;
          read_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          dedupe_key?: string;
          event_type?: string;
          category?: string;
          channel?: string;
          title?: string;
          body?: string;
          href?: string | null;
          read_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          endpoint: string;
          user_id: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          endpoint: string;
          user_id: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: {
          endpoint?: string;
          user_id?: string;
          p256dh?: string;
          auth?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_favorites: {
        Row: {
          user_id: string;
          item_type: string;
          item_id: string;
          item_slug: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          item_type: string;
          item_id: string;
          item_slug: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          item_type?: string;
          item_id?: string;
          item_slug?: string;
          created_at?: string;
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
      organizer_applications: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          description: string;
          status: "pending" | "approved" | "rejected";
          reviewed_at: string | null;
          reviewed_by: string | null;
          review_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          description?: string;
          status?: "pending" | "approved" | "rejected";
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string;
          description?: string;
          status?: "pending" | "approved" | "rejected";
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organizer_applications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organizer_applications_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_role_presets: {
        Row: {
          id: string;
          label: string;
          description: string | null;
          capabilities: string[];
          created_at: string;
        };
        Insert: {
          id: string;
          label: string;
          description?: string | null;
          capabilities?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          label?: string;
          description?: string | null;
          capabilities?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      admin_staff: {
        Row: {
          user_id: string;
          preset: string | null;
          capabilities: string[];
          is_active: boolean;
          invited_by: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          preset?: string | null;
          capabilities?: string[];
          is_active?: boolean;
          invited_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          preset?: string | null;
          capabilities?: string[];
          is_active?: boolean;
          invited_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      api_keys: {
        Row: {
          id: string;
          key_hash: string;
          key_prefix: string;
          label: string;
          partner_name: string | null;
          organizer_id: string | null;
          scopes: string[];
          rate_limit_per_minute: number;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          revoked_at: string | null;
          last_used_at: string | null;
        };
        Insert: {
          id?: string;
          key_hash: string;
          key_prefix: string;
          label: string;
          partner_name?: string | null;
          organizer_id?: string | null;
          scopes?: string[];
          rate_limit_per_minute?: number;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          revoked_at?: string | null;
          last_used_at?: string | null;
        };
        Update: {
          id?: string;
          key_hash?: string;
          key_prefix?: string;
          label?: string;
          partner_name?: string | null;
          organizer_id?: string | null;
          scopes?: string[];
          rate_limit_per_minute?: number;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          revoked_at?: string | null;
          last_used_at?: string | null;
        };
        Relationships: [];
      };
      partner_webhooks: {
        Row: {
          id: string;
          organizer_id: string;
          url: string;
          secret: string;
          events: string[];
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organizer_id: string;
          url: string;
          secret: string;
          events?: string[];
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organizer_id?: string;
          url?: string;
          secret?: string;
          events?: string[];
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partner_webhooks_organizer_id_fkey";
            columns: ["organizer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      partner_webhook_deliveries: {
        Row: {
          id: string;
          webhook_id: string;
          event: string;
          payload: Json;
          status: string;
          attempts: number;
          last_response_status: number | null;
          last_error: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          webhook_id: string;
          event: string;
          payload?: Json;
          status?: string;
          attempts?: number;
          last_response_status?: number | null;
          last_error?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          webhook_id?: string;
          event?: string;
          payload?: Json;
          status?: string;
          attempts?: number;
          last_response_status?: number | null;
          last_error?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partner_webhook_deliveries_webhook_id_fkey";
            columns: ["webhook_id"];
            isOneToOne: false;
            referencedRelation: "partner_webhooks";
            referencedColumns: ["id"];
          },
        ];
      };
      api_key_usage_log: {
        Row: {
          id: number;
          key_id: string;
          endpoint: string;
          ts: string;
          status: number;
        };
        Insert: {
          id?: number;
          key_id: string;
          endpoint: string;
          ts?: string;
          status: number;
        };
        Update: {
          id?: number;
          key_id?: string;
          endpoint?: string;
          ts?: string;
          status?: number;
        };
        Relationships: [];
      };
      admin_audit_log: {
        Row: {
          id: string;
          actor_user_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          payload: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          payload?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_user_id?: string | null;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          payload?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          event_type: string;
          tour_slug: string | null;
          tour_id: string | null;
          user_id: string | null;
          session_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          tour_slug?: string | null;
          tour_id?: string | null;
          user_id?: string | null;
          session_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          tour_slug?: string | null;
          tour_id?: string | null;
          user_id?: string | null;
          session_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      user_interactions: {
        Row: {
          id: string;
          user_id: string | null;
          anonymous_id: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          ts: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          anonymous_id?: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          ts?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          anonymous_id?: string | null;
          entity_type?: string;
          entity_id?: string;
          action?: string;
          ts?: string;
        };
        Relationships: [];
      };
      admin_notifications: {
        Row: {
          id: string;
          type: string;
          title: string;
          body: string;
          href: string | null;
          read_at: string | null;
          created_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          type: string;
          title: string;
          body: string;
          href?: string | null;
          read_at?: string | null;
          created_at?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          type?: string;
          title?: string;
          body?: string;
          href?: string | null;
          read_at?: string | null;
          created_at?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
      ai_match_events: {
        Row: {
          id: string;
          session_id: string | null;
          event_type: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          event_type: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          event_type?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_match_sessions: {
        Row: {
          id: string;
          user_id: string | null;
          messages: Json;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id?: string | null;
          messages?: Json;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          messages?: Json;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      moderation_queue: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          status: string;
          priority: number;
          submitted_by: string | null;
          assigned_to: string | null;
          reason: string | null;
          metadata: Json;
          resolved_at: string | null;
          resolved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          status?: string;
          priority?: number;
          submitted_by?: string | null;
          assigned_to?: string | null;
          reason?: string | null;
          metadata?: Json;
          resolved_at?: string | null;
          resolved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          status?: string;
          priority?: number;
          submitted_by?: string | null;
          assigned_to?: string | null;
          reason?: string | null;
          metadata?: Json;
          resolved_at?: string | null;
          resolved_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          key: string;
          value: Json;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      feature_flags: {
        Row: {
          key: string;
          enabled: boolean;
          rollout_percent: number;
          metadata: Json;
        };
        Insert: {
          key: string;
          enabled?: boolean;
          rollout_percent?: number;
          metadata?: Json;
        };
        Update: {
          key?: string;
          enabled?: boolean;
          rollout_percent?: number;
          metadata?: Json;
        };
        Relationships: [];
      };
      forum_categories: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          public_read: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          public_read?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          public_read?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      forum_threads: {
        Row: {
          id: string;
          category_id: string;
          author_id: string | null;
          title: string;
          pinned: boolean;
          locked: boolean;
          last_post_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          author_id?: string | null;
          title: string;
          pinned?: boolean;
          locked?: boolean;
          last_post_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          author_id?: string | null;
          title?: string;
          pinned?: boolean;
          locked?: boolean;
          last_post_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forum_threads_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "forum_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forum_threads_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      forum_posts: {
        Row: {
          id: string;
          thread_id: string;
          author_id: string | null;
          body: string;
          status: string;
          edited_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          author_id?: string | null;
          body: string;
          status?: string;
          edited_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          author_id?: string | null;
          body?: string;
          status?: string;
          edited_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forum_posts_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "forum_threads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forum_posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      forum_post_reports: {
        Row: {
          id: string;
          post_id: string;
          reporter_user_id: string | null;
          reason: string;
          details: string | null;
          status: string;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          reporter_user_id?: string | null;
          reason: string;
          details?: string | null;
          status?: string;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          reporter_user_id?: string | null;
          reason?: string;
          details?: string | null;
          status?: string;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forum_post_reports_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "forum_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forum_post_reports_reporter_user_id_fkey";
            columns: ["reporter_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      content_documents: {
        Row: {
          id: string;
          doc_type: string;
          slug: string;
          locale: string;
          title: string;
          status: string;
          body: Json;
          seo: Json;
          published_at: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          doc_type: string;
          slug: string;
          locale?: string;
          title: string;
          status?: string;
          body?: Json;
          seo?: Json;
          published_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          doc_type?: string;
          slug?: string;
          locale?: string;
          title?: string;
          status?: string;
          body?: Json;
          seo?: Json;
          published_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      content_revisions: {
        Row: {
          id: string;
          document_id: string;
          revision_number: number;
          title: string;
          body: Json;
          seo: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          revision_number: number;
          title: string;
          body?: Json;
          seo?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          revision_number?: number;
          title?: string;
          body?: Json;
          seo?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      content_freshness: {
        Row: {
          id: string;
          doc_slug: string;
          doc_type: string;
          last_verified_at: string;
          next_review_at: string;
          owner: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          doc_slug: string;
          doc_type: string;
          last_verified_at: string;
          next_review_at: string;
          owner?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          doc_slug?: string;
          doc_type?: string;
          last_verified_at?: string;
          next_review_at?: string;
          owner?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      group_trip_listings: {
        Row: {
          id: string;
          tour_id: string;
          organizer_id: string;
          creator_user_id: string;
          slot_date: string;
          availability_slot_id: string | null;
          min_participants: number;
          max_participants: number;
          status: string;
          description: string | null;
          min_reached_notified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tour_id: string;
          organizer_id: string;
          creator_user_id: string;
          slot_date: string;
          availability_slot_id?: string | null;
          min_participants?: number;
          max_participants: number;
          status?: string;
          description?: string | null;
          min_reached_notified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tour_id?: string;
          organizer_id?: string;
          creator_user_id?: string;
          slot_date?: string;
          availability_slot_id?: string | null;
          min_participants?: number;
          max_participants?: number;
          status?: string;
          description?: string | null;
          min_reached_notified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_trip_listings_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_trip_listings_organizer_id_fkey";
            columns: ["organizer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_trip_listings_creator_user_id_fkey";
            columns: ["creator_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_trip_listings_availability_slot_id_fkey";
            columns: ["availability_slot_id"];
            isOneToOne: false;
            referencedRelation: "tour_availability_slots";
            referencedColumns: ["id"];
          },
        ];
      };
      group_trip_members: {
        Row: {
          id: string;
          listing_id: string;
          user_id: string;
          status: string;
          joined_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          user_id: string;
          status?: string;
          joined_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          user_id?: string;
          status?: string;
          joined_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_trip_members_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "group_trip_listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_trip_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_prep_templates: {
        Row: {
          id: string;
          name: string;
          tour_type: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          tour_type?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          tour_type?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trip_prep_items: {
        Row: {
          id: string;
          template_id: string;
          category: string;
          title: string;
          description: string | null;
          sort_order: number;
          required: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          category: string;
          title: string;
          description?: string | null;
          sort_order?: number;
          required?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          template_id?: string;
          category?: string;
          title?: string;
          description?: string | null;
          sort_order?: number;
          required?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_prep_items_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "trip_prep_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_prep_progress: {
        Row: {
          id: string;
          booking_id: string;
          user_id: string;
          item_id: string;
          checked_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          user_id: string;
          item_id: string;
          checked_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          user_id?: string;
          item_id?: string;
          checked_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_prep_progress_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_prep_progress_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "trip_prep_items";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_prep_reminders_sent: {
        Row: {
          id: string;
          booking_id: string;
          kind: string;
          sent_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          kind: string;
          sent_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          kind?: string;
          sent_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_prep_reminders_sent_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      tour_availability_slots: {
        Row: {
          id: string;
          tour_id: string;
          date: string;
          capacity: number;
          booked_count: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tour_id: string;
          date: string;
          capacity?: number;
          booked_count?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tour_id?: string;
          date?: string;
          capacity?: number;
          booked_count?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tour_availability_slots_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
        ];
      };
      tour_waitlist_entries: {
        Row: {
          id: string;
          tour_id: string;
          user_id: string | null;
          email: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          slot_date: string | null;
          guests: number;
          status: string;
          source: string;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tour_id: string;
          user_id?: string | null;
          email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          slot_date?: string | null;
          guests?: number;
          status?: string;
          source?: string;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tour_id?: string;
          user_id?: string | null;
          email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          slot_date?: string | null;
          guests?: number;
          status?: string;
          source?: string;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tour_waitlist_entries_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_transactions: {
        Row: {
          id: string;
          booking_id: string;
          provider: string;
          external_id: string | null;
          amount: number;
          currency: string;
          status: string;
          type: string;
          source_event_id: string | null;
          requested_by: string | null;
          approved_by: string | null;
          request_reason: string | null;
          admin_notes: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          provider: string;
          external_id?: string | null;
          amount: number;
          currency?: string;
          status?: string;
          type: string;
          source_event_id?: string | null;
          requested_by?: string | null;
          approved_by?: string | null;
          request_reason?: string | null;
          admin_notes?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          provider?: string;
          external_id?: string | null;
          amount?: number;
          currency?: string;
          status?: string;
          type?: string;
          source_event_id?: string | null;
          requested_by?: string | null;
          approved_by?: string | null;
          request_reason?: string | null;
          admin_notes?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payout_records: {
        Row: {
          id: string;
          organizer_user_id: string;
          period: string;
          amount: number;
          currency: string;
          status: string;
          metadata: Json;
          approved_by: string | null;
          completed_at: string | null;
          admin_notes: string | null;
          exported_at: string | null;
          export_file_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organizer_user_id: string;
          period: string;
          amount: number;
          currency?: string;
          status?: string;
          metadata?: Json;
          approved_by?: string | null;
          completed_at?: string | null;
          admin_notes?: string | null;
          exported_at?: string | null;
          export_file_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organizer_user_id?: string;
          period?: string;
          amount?: number;
          currency?: string;
          status?: string;
          metadata?: Json;
          approved_by?: string | null;
          completed_at?: string | null;
          admin_notes?: string | null;
          exported_at?: string | null;
          export_file_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      privacy_requests: {
        Row: {
          id: string;
          user_id: string;
          request_type: string;
          status: string;
          reason: string | null;
          metadata: Json;
          requested_at: string;
          processed_at: string | null;
          processed_by: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          request_type?: string;
          status?: string;
          reason?: string | null;
          metadata?: Json;
          requested_at?: string;
          processed_at?: string | null;
          processed_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          request_type?: string;
          status?: string;
          reason?: string | null;
          metadata?: Json;
          requested_at?: string;
          processed_at?: string | null;
          processed_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_commission_rules: {
        Row: {
          id: string;
          name: string;
          rule_type: string;
          percent_value: number | null;
          fixed_amount: number | null;
          fixed_currency: string;
          is_default: boolean;
          active: boolean;
          utm_source_match: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          rule_type: string;
          percent_value?: number | null;
          fixed_amount?: number | null;
          fixed_currency?: string;
          is_default?: boolean;
          active?: boolean;
          utm_source_match?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          rule_type?: string;
          percent_value?: number | null;
          fixed_amount?: number | null;
          fixed_currency?: string;
          is_default?: boolean;
          active?: boolean;
          utm_source_match?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      booking_commission_snapshots: {
        Row: {
          id: string;
          booking_id: string;
          payment_transaction_id: string;
          organizer_user_id: string;
          gross_amount: number;
          commission_amount: number;
          organizer_net_amount: number;
          commission_rule_id: string | null;
          commission_percent: number | null;
          commission_fixed: number | null;
          currency: string;
          payout_record_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          payment_transaction_id: string;
          organizer_user_id: string;
          gross_amount: number;
          commission_amount: number;
          organizer_net_amount: number;
          commission_rule_id?: string | null;
          commission_percent?: number | null;
          commission_fixed?: number | null;
          currency?: string;
          payout_record_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          payment_transaction_id?: string;
          organizer_user_id?: string;
          gross_amount?: number;
          commission_amount?: number;
          organizer_net_amount?: number;
          commission_rule_id?: string | null;
          commission_percent?: number | null;
          commission_fixed?: number | null;
          currency?: string;
          payout_record_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      payment_audit_log: {
        Row: {
          id: string;
          snapshot_date: string;
          period: string | null;
          totals: Json;
          discrepancies: Json;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          snapshot_date?: string;
          period?: string | null;
          totals?: Json;
          discrepancies?: Json;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          snapshot_date?: string;
          period?: string | null;
          totals?: Json;
          discrepancies?: Json;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      search_documents: {
        Row: {
          id: string;
          slug: string;
          kind: string;
          title: string;
          description: string | null;
          body_text: string;
          url: string;
          published_at: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          kind: string;
          title: string;
          description?: string | null;
          body_text?: string;
          url: string;
          published_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          kind?: string;
          title?: string;
          description?: string | null;
          body_text?: string;
          url?: string;
          published_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin_with: {
        Args: { required_capability: string };
        Returns: boolean;
      };
      search_site_documents: {
        Args: {
          query_text: string;
          filter_kind?: string | null;
          result_limit?: number;
        };
        Returns: {
          id: string;
          slug: string;
          kind: string;
          title: string;
          description: string | null;
          url: string;
          published_at: string | null;
          rank: number;
        }[];
      };
    };
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
export type ConversationThreadRow =
  Database["public"]["Tables"]["conversation_threads"]["Row"];
export type ConversationThreadInsert =
  Database["public"]["Tables"]["conversation_threads"]["Insert"];
export type ConversationMessageRow =
  Database["public"]["Tables"]["conversation_messages"]["Row"];
export type ConversationMessageInsert =
  Database["public"]["Tables"]["conversation_messages"]["Insert"];
export type TourRow = Database["public"]["Tables"]["tours"]["Row"];
export type TourInsert = Database["public"]["Tables"]["tours"]["Insert"];
export type TourUpdate = Database["public"]["Tables"]["tours"]["Update"];
export type ShopOrderRow = Database["public"]["Tables"]["shop_orders"]["Row"];
export type ShopOrderInsert = Database["public"]["Tables"]["shop_orders"]["Insert"];
export type ShopOrderUpdate = Database["public"]["Tables"]["shop_orders"]["Update"];
export type PaymentTransactionDbRow =
  Database["public"]["Tables"]["payment_transactions"]["Row"];
export type PaymentTransactionInsert =
  Database["public"]["Tables"]["payment_transactions"]["Insert"];
export type PaymentTransactionUpdate =
  Database["public"]["Tables"]["payment_transactions"]["Update"];
export type PayoutRecordDbRow = Database["public"]["Tables"]["payout_records"]["Row"];
export type PayoutRecordInsert = Database["public"]["Tables"]["payout_records"]["Insert"];
export type PaymentAuditLogRow = Database["public"]["Tables"]["payment_audit_log"]["Row"];
export type PaymentAuditLogInsert = Database["public"]["Tables"]["payment_audit_log"]["Insert"];

export type NewsletterSubscriber =
  Database["public"]["Tables"]["newsletter_subscribers"]["Row"];
export type ContactSubmission = Database["public"]["Tables"]["contact_submissions"]["Row"];
export type ContactSubmissionInsert =
  Database["public"]["Tables"]["contact_submissions"]["Insert"];
export type OrganizerApplicationRow =
  Database["public"]["Tables"]["organizer_applications"]["Row"];
export type OrganizerApplicationInsert =
  Database["public"]["Tables"]["organizer_applications"]["Insert"];
export type OrganizerApplicationUpdate =
  Database["public"]["Tables"]["organizer_applications"]["Update"];
export type LocalExpertRow = Database["public"]["Tables"]["local_experts"]["Row"];
export type LocalExpertInsert = Database["public"]["Tables"]["local_experts"]["Insert"];
export type LocalExpertUpdate = Database["public"]["Tables"]["local_experts"]["Update"];
export type ExpertInquiryRow = Database["public"]["Tables"]["expert_inquiries"]["Row"];
export type ExpertInquiryInsert = Database["public"]["Tables"]["expert_inquiries"]["Insert"];
export type ExpertInquiryUpdate = Database["public"]["Tables"]["expert_inquiries"]["Update"];
export type NewsletterSubscriberInsert =
  Database["public"]["Tables"]["newsletter_subscribers"]["Insert"];
