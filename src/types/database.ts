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
    };
    Views: Record<string, never>;
    Functions: {
      is_admin_with: {
        Args: { required_capability: string };
        Returns: boolean;
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
export type TourRow = Database["public"]["Tables"]["tours"]["Row"];
export type TourInsert = Database["public"]["Tables"]["tours"]["Insert"];
export type TourUpdate = Database["public"]["Tables"]["tours"]["Update"];
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
