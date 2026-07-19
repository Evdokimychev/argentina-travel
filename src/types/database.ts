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

export type ContactSubmissionStatus =
  | "new"
  | "in_progress"
  | "waiting"
  | "resolved"
  | "spam";

export type AccountRoleDb = "tourist" | "organizer" | "admin";

type DatabaseTable<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type SocialChannelConnectionRow = {
  id: string;
  project_key: string;
  provider: string;
  label: string;
  external_account_id: string | null;
  handle: string | null;
  status: string;
  capabilities: string[];
  config: Json;
  last_verified_at: string | null;
  last_used_at: string | null;
  last_error_code: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SocialChannelSecretRow = {
  id: string;
  connection_id: string;
  secret_name: string;
  vault_secret_id: string;
  created_at: string;
  updated_at: string;
};

export type ContentFactoryItemRow = {
  id: string;
  project_key: string;
  source_document_id: string | null;
  title: string;
  brief: string;
  audience: string;
  content_pillar: string;
  goal: string;
  status: string;
  priority: number;
  scheduled_at: string | null;
  published_at: string | null;
  metadata: Json;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentFactoryVariantRow = {
  id: string;
  item_id: string;
  channel: string;
  format: string;
  body: string;
  media_urls: string[];
  link_url: string | null;
  target: string | null;
  status: string;
  provider_options: Json;
  published_at: string | null;
  external_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentPublicationJobRow = {
  id: string;
  variant_id: string;
  connection_id: string | null;
  idempotency_key: string;
  status: string;
  scheduled_for: string;
  started_at: string | null;
  finished_at: string | null;
  attempt_count: number;
  max_attempts: number;
  external_publication_id: string | null;
  external_url: string | null;
  error_code: string | null;
  error_summary: string | null;
  response_metadata: Json;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SocialInboxThreadRow = {
  id: string;
  project_key: string;
  connection_id: string;
  provider: string;
  external_user_id: string;
  display_name: string | null;
  contact_phone: string | null;
  status: string;
  unread_count: number;
  last_message_preview: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SocialInboxMessageRow = {
  id: string;
  thread_id: string;
  external_message_id: string;
  direction: string;
  message_type: string;
  body: string;
  media: Json;
  delivery_status: string;
  provider_timestamp: string | null;
  raw_event: Json;
  created_at: string;
};

type ContentSourceRow = {
  id: string;
  title: string;
  authority: string;
  url: string;
  source_type: string;
  jurisdiction: string | null;
  language: string;
  published_at: string | null;
  source_updated_at: string | null;
  checked_at: string;
  accessed_at: string;
  content_hash: string | null;
  archive_reference: string | null;
  trust_level: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type KnowledgeClaimRow = {
  id: string;
  content_document_id: string;
  section_id: string;
  statement: string;
  locale: string;
  topic: string;
  risk_level: string;
  jurisdiction: string | null;
  source_id: string;
  effective_from: string | null;
  effective_to: string | null;
  last_verified_at: string;
  next_review_at: string;
  verified_by: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type DynamicFactRow = {
  id: string;
  kind: string;
  entity_id: string;
  label: string;
  value: number | null;
  min_value: number | null;
  max_value: number | null;
  currency: string | null;
  unit: string | null;
  source_id: string;
  observed_at: string;
  verified_at: string;
  expires_at: string;
  fetch_method: string;
  fallback: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type ContentSourceLinkRow = {
  content_document_id: string;
  source_id: string;
  section_id: string;
  purpose: string;
  is_primary: boolean;
  created_at: string;
};

type EntityRelationRow = {
  source_entity_id: string;
  target_entity_id: string;
  relation_type: string;
  relevance_score: number;
  editorial_priority: number;
  status: string;
  created_at: string;
  updated_at: string;
};

type ContentWidgetRegistryRow = {
  id: string;
  type: string;
  purpose: string;
  owner: string;
  allowed_content_types: string[];
  required_data: Json;
  source_requirements: Json;
  loading_state: string;
  empty_state: string;
  error_state: string;
  stale_state: string;
  analytics_event: string;
  accessibility_requirements: string;
  performance_budget: Json;
  schema_version: number;
  status: string;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

type ContentWidgetUsageRow = {
  content_document_id: string;
  widget_id: string;
  section_id: string;
  config: Json;
  status: string;
  created_at: string;
  updated_at: string;
};

type ContentMediaUsageRow = {
  content_document_id: string;
  media_asset_id: string;
  role: string;
  section_id: string;
  created_at: string;
};

type IngestionSourceRow = {
  id: string; legacy_key: string | null; name: string; source_type: string; status: string;
  description: string | null; language: string; region: string | null; categories: string[];
  connection_config: Json; credential_ref: string | null; schedule_kind: string;
  schedule_expression: string | null; enabled: boolean; priority: number; trust_level: number;
  legal_notes: string | null; rate_limit_per_minute: number; retry_policy: Json;
  timeout_seconds: number; checkpoint: Json; owner_user_id: string | null;
  last_run_at: string | null; last_success_at: string | null; next_run_at: string | null;
  last_error: string | null; last_tested_at: string | null; last_test_ok: boolean | null;
  created_at: string; updated_at: string;
};

type IngestionSourceRunRow = {
  id: string; source_id: string; trigger_kind: string; status: string; idempotency_key: string;
  retry_of_run_id: string | null; attempt: number; max_attempts: number; next_retry_at: string | null;
  dead_lettered_at: string | null; actor_user_id: string | null; checkpoint_before: Json;
  checkpoint_after: Json; counts: Json; error_category: string | null; error_message: string | null;
  cancel_requested_at: string | null; heartbeat_at: string | null; started_at: string | null;
  completed_at: string | null; created_at: string;
};

type IngestionRawDocumentRow = {
  id: string; source_id: string; source_run_id: string; parent_document_id: string | null;
  external_id: string; version: number; source_url: string | null; canonical_url: string | null;
  raw_format: string; raw_content: string | null; raw_payload: Json; content_hash: string;
  media: Json; title: string | null; author: string | null; language: string | null;
  source_published_at: string | null; source_updated_at: string | null; fetched_at: string;
  status: string; archived_at: string | null; created_at: string;
};

type IngestionNormalizedDocumentRow = {
  id: string; raw_document_id: string; source_id: string; source_run_id: string;
  title: string; body: string; summary: string; language: string; category: string | null;
  province: string | null; city: string | null; tags: string[]; fingerprint: string;
  metadata: Json; normalized_at: string; created_at: string;
};

type IngestionCandidateRow = {
  id: string; normalized_document_id: string; source_id: string; source_run_id: string;
  status: string; title: string; summary: string; processed_content: string; language: string;
  category: string | null; province: string | null; city: string | null; tags: string[];
  quality_score: number; freshness_score: number; trust_score: number;
  decision_reasons: string[]; flags: string[]; extracted_entities: Json;
  suggested_target: string; ai_result: Json | null; ai_prompt_version: string | null;
  ai_model: string | null; ai_latency_ms: number | null; ai_input_tokens: number | null;
  ai_output_tokens: number | null; assigned_to: string | null; moderation_notes: string | null;
  moderated_by: string | null; moderated_at: string | null; cms_document_id: string | null;
  publication_target: string | null; published_at: string | null; created_at: string; updated_at: string;
};

type IngestionDuplicateLinkRow = {
  candidate_id: string; related_candidate_id: string; relation_type: string; similarity: number;
  resolution: string; resolved_by: string | null; resolved_at: string | null; created_at: string;
};

type IngestionProcessingStepRow = {
  id: string; source_run_id: string; raw_document_id: string | null; candidate_id: string | null;
  step_name: string; status: string; attempt: number; max_attempts: number; input_summary: Json;
  output_summary: Json; error_category: string | null; error_message: string | null;
  started_at: string | null; completed_at: string | null; latency_ms: number | null; created_at: string;
};

type IngestionPromptVersionRow = {
  id: string; task: string; version: number; provider: string; model: string; system_prompt: string;
  output_schema: Json; status: string; created_by: string | null; created_at: string; activated_at: string | null;
};

type IngestionMigrationLedgerRow = {
  id: string; migration_id: string; source_system: string; entity_type: string; legacy_id: string;
  target_table: string | null; target_id: string | null; checksum: string; status: string;
  error_message: string | null; migrated_at: string;
};

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
          row_version: number;
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
          row_version?: number;
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
          row_version?: number;
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
          operation_version: number;
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
          operation_version?: number;
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
          operation_version?: number;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      booking_lookup_challenges: {
        Row: {
          id: string;
          email_hash: string;
          code_hash: string;
          booking_ids: string[];
          expires_at: string;
          attempts: number;
          max_attempts: number;
          consumed_at: string | null;
          session_token_hash: string | null;
          session_expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email_hash: string;
          code_hash: string;
          booking_ids?: string[];
          expires_at: string;
          attempts?: number;
          max_attempts?: number;
          consumed_at?: string | null;
          session_token_hash?: string | null;
          session_expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          attempts?: number;
          consumed_at?: string | null;
          session_token_hash?: string | null;
          session_expires_at?: string | null;
        };
        Relationships: [];
      };
      booking_lookup_audit_log: {
        Row: {
          id: string;
          challenge_id: string | null;
          event: string;
          ip_hash: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          challenge_id?: string | null;
          event: string;
          ip_hash?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: never;
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
          row_version: number;
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
          row_version?: number;
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
          row_version?: number;
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
          row_version: number;
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
          row_version?: number;
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
          row_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tours: {
        Row: {
          id: string;
          market_code: string;
          slug: string;
          owner_user_id: string;
          status: string;
          title: string;
          listing: Json | null;
          payload: Json;
          product_type: string;
          editor_draft: Json | null;
          approved_listing: Json | null;
          approved_payload: Json | null;
          approved_at: string | null;
          published_at: string | null;
          moderation_status: string;
          moderation_notes: string | null;
          moderated_by: string | null;
          moderated_at: string | null;
          row_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          market_code?: string;
          slug: string;
          owner_user_id: string;
          status?: string;
          title: string;
          listing?: Json | null;
          payload: Json;
          product_type?: string;
          editor_draft?: Json | null;
          approved_listing?: Json | null;
          approved_payload?: Json | null;
          approved_at?: string | null;
          published_at?: string | null;
          moderation_status?: string;
          moderation_notes?: string | null;
          moderated_by?: string | null;
          moderated_at?: string | null;
          row_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          market_code?: string;
          slug?: string;
          owner_user_id?: string;
          status?: string;
          title?: string;
          listing?: Json | null;
          payload?: Json;
          product_type?: string;
          editor_draft?: Json | null;
          approved_listing?: Json | null;
          approved_payload?: Json | null;
          approved_at?: string | null;
          published_at?: string | null;
          moderation_status?: string;
          moderation_notes?: string | null;
          moderated_by?: string | null;
          moderated_at?: string | null;
          row_version?: number;
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
          operation_version: number;
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
          operation_version?: number;
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
          operation_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      operations_transition_outbox: {
        Row: {
          id: string;
          entity_type: "booking" | "shop_order";
          entity_id: string;
          event_key: "booking.status_changed" | "shop_order.status_changed";
          recipient_kind: "customer" | "organizer" | "admin";
          status: "pending" | "processing" | "delivered" | "failed" | "dead";
          payload: Json;
          dedupe_key: string;
          attempts: number;
          next_attempt_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          entity_type: "booking" | "shop_order";
          entity_id: string;
          event_key: "booking.status_changed" | "shop_order.status_changed";
          recipient_kind: "customer" | "organizer" | "admin";
          status?: "pending" | "processing" | "delivered" | "failed" | "dead";
          payload?: Json;
          dedupe_key: string;
          attempts?: number;
          next_attempt_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: "booking" | "shop_order";
          entity_id?: string;
          event_key?: "booking.status_changed" | "shop_order.status_changed";
          recipient_kind?: "customer" | "organizer" | "admin";
          status?: "pending" | "processing" | "delivered" | "failed" | "dead";
          payload?: Json;
          dedupe_key?: string;
          attempts?: number;
          next_attempt_at?: string | null;
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
      youtravel_tours: {
        Row: {
          id: number;
          slug: string;
          title: string;
          country: string | null;
          region: string | null;
          city: string | null;
          status: string | null;
          duration_days: number | null;
          duration_nights: number | null;
          rating: number | null;
          review_count: number;
          price_value: number | null;
          price_currency: string | null;
          price_display: string | null;
          youtravel_url: string;
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
          title: string;
          country?: string | null;
          region?: string | null;
          city?: string | null;
          status?: string | null;
          duration_days?: number | null;
          duration_nights?: number | null;
          rating?: number | null;
          review_count?: number;
          price_value?: number | null;
          price_currency?: string | null;
          price_display?: string | null;
          youtravel_url: string;
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
          title?: string;
          country?: string | null;
          region?: string | null;
          city?: string | null;
          status?: string | null;
          duration_days?: number | null;
          duration_nights?: number | null;
          rating?: number | null;
          review_count?: number;
          price_value?: number | null;
          price_currency?: string | null;
          price_display?: string | null;
          youtravel_url?: string;
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
      youtravel_offers: {
        Row: {
          id: number;
          tour_id: number;
          start_date: string | null;
          end_date: string | null;
          price_value: number | null;
          price_currency: string | null;
          seats_available: number | null;
          payload: Json;
          synced_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: number;
          tour_id: number;
          start_date?: string | null;
          end_date?: string | null;
          price_value?: number | null;
          price_currency?: string | null;
          seats_available?: number | null;
          payload?: Json;
          synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          tour_id?: number;
          start_date?: string | null;
          end_date?: string | null;
          price_value?: number | null;
          price_currency?: string | null;
          seats_available?: number | null;
          payload?: Json;
          synced_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      youtravel_booking_requests: {
        Row: {
          id: string;
          tour_id: number;
          tour_slug: string;
          user_id: string | null;
          offer_id: number | null;
          start_date: string;
          end_date: string | null;
          persons_count: number;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          message: string | null;
          youtravel_order_id: string | null;
          youtravel_order_url: string | null;
          youtravel_status: string | null;
          price_snapshot: Json | null;
          created_at: string;
          updated_at: string;
          status_synced_at: string | null;
        };
        Insert: {
          id?: string;
          tour_id: number;
          tour_slug: string;
          user_id?: string | null;
          offer_id?: number | null;
          start_date: string;
          end_date?: string | null;
          persons_count: number;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          message?: string | null;
          youtravel_order_id?: string | null;
          youtravel_order_url?: string | null;
          youtravel_status?: string | null;
          price_snapshot?: Json | null;
          created_at?: string;
          updated_at?: string;
          status_synced_at?: string | null;
        };
        Update: {
          id?: string;
          tour_id?: number;
          tour_slug?: string;
          user_id?: string | null;
          offer_id?: number | null;
          start_date?: string;
          end_date?: string | null;
          persons_count?: number;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          message?: string | null;
          youtravel_order_id?: string | null;
          youtravel_order_url?: string | null;
          youtravel_status?: string | null;
          price_snapshot?: Json | null;
          created_at?: string;
          updated_at?: string;
          status_synced_at?: string | null;
        };
        Relationships: [];
      };
      youtravel_affise_snapshots: {
        Row: {
          id: string;
          snapshot_date: string;
          conversions: number;
          clicks: number | null;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          snapshot_date: string;
          conversions?: number;
          clicks?: number | null;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          snapshot_date?: string;
          conversions?: number;
          clicks?: number | null;
          source?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      youtravel_sync_runs: {
        Row: {
          id: string;
          started_at: string;
          finished_at: string | null;
          status: string;
          tours_fetched: number;
          tours_upserted: number;
          offers_upserted: number;
          error_message: string | null;
          payload: Json;
        };
        Insert: {
          id?: string;
          started_at?: string;
          finished_at?: string | null;
          status?: string;
          tours_fetched?: number;
          tours_upserted?: number;
          offers_upserted?: number;
          error_message?: string | null;
          payload?: Json;
        };
        Update: {
          id?: string;
          started_at?: string;
          finished_at?: string | null;
          status?: string;
          tours_fetched?: number;
          tours_upserted?: number;
          offers_upserted?: number;
          error_message?: string | null;
          payload?: Json;
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
      blog_reading_history: {
        Row: {
          id: string;
          user_id: string;
          article_slug: string;
          article_title: string;
          category: string | null;
          read_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          article_slug: string;
          article_title: string;
          category?: string | null;
          read_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          article_slug?: string;
          article_title?: string;
          category?: string | null;
          read_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blog_reading_history_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      blog_article_comments: {
        Row: {
          id: string;
          article_slug: string;
          user_id: string;
          body: string;
          status: string;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          article_slug: string;
          user_id: string;
          body: string;
          status?: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          article_slug?: string;
          user_id?: string;
          body?: string;
          status?: string;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blog_article_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blog_article_comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "blog_article_comments";
            referencedColumns: ["id"];
          },
        ];
      };
      blog_comment_reports: {
        Row: {
          id: string;
          comment_id: string;
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
          comment_id: string;
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
          comment_id?: string;
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
            foreignKeyName: "blog_comment_reports_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "blog_article_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blog_comment_reports_reporter_user_id_fkey";
            columns: ["reporter_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blog_comment_reports_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
          status: ContactSubmissionStatus;
          assigned_to: string | null;
          admin_notes: string;
          next_action_at: string | null;
          created_at: string;
          updated_at: string;
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
          status?: ContactSubmissionStatus;
          assigned_to?: string | null;
          admin_notes?: string;
          next_action_at?: string | null;
          created_at?: string;
          updated_at?: string;
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
          status?: ContactSubmissionStatus;
          assigned_to?: string | null;
          admin_notes?: string;
          next_action_at?: string | null;
          created_at?: string;
          updated_at?: string;
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
          row_version: number;
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
          row_version?: number;
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
          row_version?: number;
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
          event_id: string | null;
          event_type: string;
          ingestion_source: string;
          tour_slug: string | null;
          tour_id: string | null;
          user_id: string | null;
          session_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string | null;
          event_type: string;
          ingestion_source?: string;
          tour_slug?: string | null;
          tour_id?: string | null;
          user_id?: string | null;
          session_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string | null;
          event_type?: string;
          ingestion_source?: string;
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
          row_version: number;
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
          row_version?: number;
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
          row_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      moderation_delivery_outbox: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          event_key: string;
          status: string;
          payload: Json;
          dedupe_key: string;
          attempts: number;
          next_attempt_at: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          event_key?: string;
          status?: string;
          payload?: Json;
          dedupe_key: string;
          attempts?: number;
          next_attempt_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          event_key?: string;
          status?: string;
          payload?: Json;
          dedupe_key?: string;
          attempts?: number;
          next_attempt_at?: string | null;
          delivered_at?: string | null;
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
          row_version: number;
        };
        Insert: {
          key: string;
          value?: Json;
          updated_by?: string | null;
          updated_at?: string;
          row_version?: number;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_by?: string | null;
          updated_at?: string;
          row_version?: number;
        };
        Relationships: [];
      };
      site_settings_control_plane: {
        Row: {
          singleton: boolean;
          revision: number;
          features: Json;
          navigation: Json;
          modules: Json;
          updated_at: string;
        };
        Insert: {
          singleton?: boolean;
          revision?: number;
          features?: Json;
          navigation?: Json;
          modules?: Json;
          updated_at?: string;
        };
        Update: {
          singleton?: boolean;
          revision?: number;
          features?: Json;
          navigation?: Json;
          modules?: Json;
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
      map_object_curation: {
        Row: {
          object_id: string;
          latitude: number | null;
          longitude: number | null;
          importance: number;
          featured: boolean;
          editorial_priority: number;
          quality_score: number;
          source: string | null;
          source_url: string | null;
          source_verified_at: string | null;
          min_zoom: number;
          max_zoom: number;
          region: string | null;
          tags: string[];
          status: "published" | "hidden" | "needs_review";
          curator_note: string | null;
          related_article_href: string | null;
          related_tour_href: string | null;
          related_airport_iata: string | null;
          updated_by: string | null;
          row_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          object_id: string;
          latitude?: number | null;
          longitude?: number | null;
          importance?: number;
          featured?: boolean;
          editorial_priority?: number;
          quality_score?: number;
          source?: string | null;
          source_url?: string | null;
          source_verified_at?: string | null;
          min_zoom?: number;
          max_zoom?: number;
          region?: string | null;
          tags?: string[];
          status?: "published" | "hidden" | "needs_review";
          curator_note?: string | null;
          related_article_href?: string | null;
          related_tour_href?: string | null;
          related_airport_iata?: string | null;
          updated_by?: string | null;
          row_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          object_id?: string;
          latitude?: number | null;
          longitude?: number | null;
          importance?: number;
          featured?: boolean;
          editorial_priority?: number;
          quality_score?: number;
          source?: string | null;
          source_url?: string | null;
          source_verified_at?: string | null;
          min_zoom?: number;
          max_zoom?: number;
          region?: string | null;
          tags?: string[];
          status?: "published" | "hidden" | "needs_review";
          curator_note?: string | null;
          related_article_href?: string | null;
          related_tour_href?: string | null;
          related_airport_iata?: string | null;
          updated_by?: string | null;
          row_version?: number;
          created_at?: string;
          updated_at?: string;
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
          row_version: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          author_id?: string | null;
          body: string;
          status?: string;
          edited_at?: string | null;
          row_version?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          author_id?: string | null;
          body?: string;
          status?: string;
          edited_at?: string | null;
          row_version?: number;
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
          row_version: number;
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
          row_version?: number;
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
          row_version?: number;
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
      cms_media_assets: {
        Row: {
          id: string;
          title: string;
          alt: string;
          storage_path: string;
          public_url: string;
          mime_type: string | null;
          file_size: number | null;
          width: number | null;
          height: number | null;
          category: string;
          tags: string[];
          role: string;
          manifest_synced: boolean;
          original_url: string | null;
          source_platform: string | null;
          source_page_url: string | null;
          creator: string | null;
          creator_profile_url: string | null;
          license: string | null;
          license_url: string | null;
          attribution_text: string | null;
          accessed_at: string | null;
          rights_verified_at: string | null;
          rights_verified_by: string | null;
          location_entity_id: string | null;
          capture_date: string | null;
          caption_ru: string | null;
          focal_point: Json;
          content_hash: string | null;
          rights_status: string;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          alt?: string;
          storage_path: string;
          public_url: string;
          mime_type?: string | null;
          file_size?: number | null;
          width?: number | null;
          height?: number | null;
          category?: string;
          tags?: string[];
          role?: string;
          manifest_synced?: boolean;
          original_url?: string | null;
          source_platform?: string | null;
          source_page_url?: string | null;
          creator?: string | null;
          creator_profile_url?: string | null;
          license?: string | null;
          license_url?: string | null;
          attribution_text?: string | null;
          accessed_at?: string | null;
          rights_verified_at?: string | null;
          rights_verified_by?: string | null;
          location_entity_id?: string | null;
          capture_date?: string | null;
          caption_ru?: string | null;
          focal_point?: Json;
          content_hash?: string | null;
          rights_status?: string;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          alt?: string;
          storage_path?: string;
          public_url?: string;
          mime_type?: string | null;
          file_size?: number | null;
          width?: number | null;
          height?: number | null;
          category?: string;
          tags?: string[];
          role?: string;
          manifest_synced?: boolean;
          original_url?: string | null;
          source_platform?: string | null;
          source_page_url?: string | null;
          creator?: string | null;
          creator_profile_url?: string | null;
          license?: string | null;
          license_url?: string | null;
          attribution_text?: string | null;
          accessed_at?: string | null;
          rights_verified_at?: string | null;
          rights_verified_by?: string | null;
          location_entity_id?: string | null;
          capture_date?: string | null;
          caption_ru?: string | null;
          focal_point?: Json;
          content_hash?: string | null;
          rights_status?: string;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      url_redirects: {
        Row: {
          id: string;
          from_path: string;
          to_path: string;
          status_code: number;
          enabled: boolean;
          note: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          from_path: string;
          to_path: string;
          status_code?: number;
          enabled?: boolean;
          note?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          from_path?: string;
          to_path?: string;
          status_code?: number;
          enabled?: boolean;
          note?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
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
          scheduled_publish_at: string | null;
          workflow_stage: string;
          risk_level: string;
          reviewer_id: string | null;
          last_fact_checked_at: string | null;
          next_review_at: string | null;
          last_substantive_update_at: string | null;
          schema_version: number;
          created_by: string | null;
          updated_by: string | null;
          row_version: number;
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
          scheduled_publish_at?: string | null;
          workflow_stage?: string;
          risk_level?: string;
          reviewer_id?: string | null;
          last_fact_checked_at?: string | null;
          next_review_at?: string | null;
          last_substantive_update_at?: string | null;
          schema_version?: number;
          created_by?: string | null;
          updated_by?: string | null;
          row_version?: number;
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
          scheduled_publish_at?: string | null;
          workflow_stage?: string;
          risk_level?: string;
          reviewer_id?: string | null;
          last_fact_checked_at?: string | null;
          next_review_at?: string | null;
          last_substantive_update_at?: string | null;
          schema_version?: number;
          created_by?: string | null;
          updated_by?: string | null;
          row_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      content_factory_items: DatabaseTable<
        ContentFactoryItemRow,
        Partial<ContentFactoryItemRow> & Pick<ContentFactoryItemRow, "title">,
        Partial<ContentFactoryItemRow>
      >;
      content_factory_variants: DatabaseTable<
        ContentFactoryVariantRow,
        Partial<ContentFactoryVariantRow> & Pick<ContentFactoryVariantRow, "item_id" | "channel">,
        Partial<ContentFactoryVariantRow>
      >;
      content_publication_jobs: DatabaseTable<
        ContentPublicationJobRow,
        Partial<ContentPublicationJobRow> & Pick<ContentPublicationJobRow, "variant_id">,
        Partial<ContentPublicationJobRow>
      >;
      social_channel_connections: DatabaseTable<
        SocialChannelConnectionRow,
        Partial<SocialChannelConnectionRow> & Pick<SocialChannelConnectionRow, "provider" | "label">,
        Partial<SocialChannelConnectionRow>
      >;
      social_channel_secrets: DatabaseTable<
        SocialChannelSecretRow,
        Partial<SocialChannelSecretRow> & Pick<SocialChannelSecretRow, "connection_id" | "secret_name" | "vault_secret_id">,
        Partial<SocialChannelSecretRow>
      >;
      social_inbox_threads: DatabaseTable<
        SocialInboxThreadRow,
        Partial<SocialInboxThreadRow> & Pick<SocialInboxThreadRow, "connection_id" | "provider" | "external_user_id">,
        Partial<SocialInboxThreadRow>
      >;
      social_inbox_messages: DatabaseTable<
        SocialInboxMessageRow,
        Partial<SocialInboxMessageRow> & Pick<SocialInboxMessageRow, "thread_id" | "external_message_id" | "direction">,
        Partial<SocialInboxMessageRow>
      >;
      content_sources: DatabaseTable<
        ContentSourceRow,
        Partial<ContentSourceRow> & Pick<ContentSourceRow, "title" | "authority" | "url" | "source_type" | "checked_at">,
        Partial<ContentSourceRow>
      >;
      ingestion_sources: DatabaseTable<
        IngestionSourceRow,
        Partial<IngestionSourceRow> & Pick<IngestionSourceRow, "name" | "source_type">,
        Partial<IngestionSourceRow>
      >;
      ingestion_source_runs: DatabaseTable<
        IngestionSourceRunRow,
        Partial<IngestionSourceRunRow> & Pick<IngestionSourceRunRow, "source_id" | "idempotency_key">,
        Partial<IngestionSourceRunRow>
      >;
      ingestion_raw_documents: DatabaseTable<
        IngestionRawDocumentRow,
        Partial<IngestionRawDocumentRow> & Pick<IngestionRawDocumentRow, "source_id" | "source_run_id" | "external_id" | "raw_format" | "content_hash">,
        Partial<IngestionRawDocumentRow>
      >;
      ingestion_normalized_documents: DatabaseTable<
        IngestionNormalizedDocumentRow,
        Partial<IngestionNormalizedDocumentRow> & Pick<IngestionNormalizedDocumentRow, "raw_document_id" | "source_id" | "source_run_id" | "title" | "body" | "fingerprint">,
        Partial<IngestionNormalizedDocumentRow>
      >;
      ingestion_candidates: DatabaseTable<
        IngestionCandidateRow,
        Partial<IngestionCandidateRow> & Pick<IngestionCandidateRow, "normalized_document_id" | "source_id" | "source_run_id" | "title" | "processed_content">,
        Partial<IngestionCandidateRow>
      >;
      ingestion_duplicate_links: DatabaseTable<
        IngestionDuplicateLinkRow,
        Partial<IngestionDuplicateLinkRow> & Pick<IngestionDuplicateLinkRow, "candidate_id" | "related_candidate_id" | "relation_type">,
        Partial<IngestionDuplicateLinkRow>
      >;
      ingestion_processing_steps: DatabaseTable<
        IngestionProcessingStepRow,
        Partial<IngestionProcessingStepRow> & Pick<IngestionProcessingStepRow, "source_run_id" | "step_name">,
        Partial<IngestionProcessingStepRow>
      >;
      ingestion_prompt_versions: DatabaseTable<
        IngestionPromptVersionRow,
        Partial<IngestionPromptVersionRow> & Pick<IngestionPromptVersionRow, "id" | "task" | "version" | "model" | "system_prompt">,
        Partial<IngestionPromptVersionRow>
      >;
      ingestion_migration_ledger: DatabaseTable<
        IngestionMigrationLedgerRow,
        Partial<IngestionMigrationLedgerRow> & Pick<IngestionMigrationLedgerRow, "migration_id" | "source_system" | "entity_type" | "legacy_id" | "checksum">,
        Partial<IngestionMigrationLedgerRow>
      >;
      content_source_links: DatabaseTable<
        ContentSourceLinkRow,
        Partial<ContentSourceLinkRow> & Pick<ContentSourceLinkRow, "content_document_id" | "source_id">,
        Partial<ContentSourceLinkRow>
      >;
      knowledge_claims: DatabaseTable<
        KnowledgeClaimRow,
        Partial<KnowledgeClaimRow> & Pick<KnowledgeClaimRow, "content_document_id" | "statement" | "topic" | "source_id" | "last_verified_at" | "next_review_at">,
        Partial<KnowledgeClaimRow>
      >;
      dynamic_facts: DatabaseTable<
        DynamicFactRow,
        Partial<DynamicFactRow> & Pick<DynamicFactRow, "kind" | "entity_id" | "label" | "source_id" | "observed_at" | "verified_at" | "expires_at">,
        Partial<DynamicFactRow>
      >;
      entity_relations: DatabaseTable<
        EntityRelationRow,
        Partial<EntityRelationRow> & Pick<EntityRelationRow, "source_entity_id" | "target_entity_id" | "relation_type">,
        Partial<EntityRelationRow>
      >;
      content_widget_registry: DatabaseTable<
        ContentWidgetRegistryRow,
        Partial<ContentWidgetRegistryRow> & Pick<ContentWidgetRegistryRow, "id" | "type" | "purpose" | "owner" | "loading_state" | "empty_state" | "error_state" | "stale_state" | "analytics_event" | "accessibility_requirements">,
        Partial<ContentWidgetRegistryRow>
      >;
      content_widget_usages: DatabaseTable<
        ContentWidgetUsageRow,
        Partial<ContentWidgetUsageRow> & Pick<ContentWidgetUsageRow, "content_document_id" | "widget_id">,
        Partial<ContentWidgetUsageRow>
      >;
      content_media_usages: DatabaseTable<
        ContentMediaUsageRow,
        Partial<ContentMediaUsageRow> & Pick<ContentMediaUsageRow, "content_document_id" | "media_asset_id" | "role">,
        Partial<ContentMediaUsageRow>
      >;
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
      cms_search_outbox: {
        Row: {
          id: string;
          document_id: string;
          document_version: number;
          intent: "upsert" | "delete";
          document_snapshot: Json;
          status: "pending" | "processing" | "completed" | "failed";
          attempts: number;
          last_error: string | null;
          next_attempt_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          document_version: number;
          intent: "upsert" | "delete";
          document_snapshot: Json;
          status?: "pending" | "processing" | "completed" | "failed";
          attempts?: number;
          last_error?: string | null;
          next_attempt_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "pending" | "processing" | "completed" | "failed";
          attempts?: number;
          last_error?: string | null;
          next_attempt_at?: string;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      cms_import_operations: {
        Row: {
          operation_id: string;
          payload_hash: string;
          actor_user_id: string | null;
          status: "running" | "completed";
          total_count: number;
          result: Json | null;
          created_at: string;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          operation_id: string;
          payload_hash: string;
          actor_user_id?: string | null;
          status?: "running" | "completed";
          total_count: number;
          result?: Json | null;
          created_at?: string;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          status?: "running" | "completed";
          result?: Json | null;
          completed_at?: string | null;
          updated_at?: string;
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
          status_history: Json;
          organizer_comments: Json;
          converted_booking_id: string | null;
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
          status_history?: Json;
          organizer_comments?: Json;
          converted_booking_id?: string | null;
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
          status_history?: Json;
          organizer_comments?: Json;
          converted_booking_id?: string | null;
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
          request_idempotency_key: string | null;
          source_transaction_id: string | null;
          claimed_by: string | null;
          claimed_at: string | null;
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
          request_idempotency_key?: string | null;
          source_transaction_id?: string | null;
          claimed_by?: string | null;
          claimed_at?: string | null;
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
          request_idempotency_key?: string | null;
          source_transaction_id?: string | null;
          claimed_by?: string | null;
          claimed_at?: string | null;
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
          created_by: string | null;
          approved_at: string | null;
          exported_by: string | null;
          completed_by: string | null;
          cancelled_by: string | null;
          cancelled_at: string | null;
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
          created_by?: string | null;
          approved_at?: string | null;
          exported_by?: string | null;
          completed_by?: string | null;
          cancelled_by?: string | null;
          cancelled_at?: string | null;
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
          created_by?: string | null;
          approved_at?: string | null;
          exported_by?: string | null;
          completed_by?: string | null;
          cancelled_by?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      commercial_adapters: {
        Row: {
          id: string;
          adapter_type: string;
          code: string;
          label: string;
          description: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          adapter_type: string;
          code: string;
          label: string;
          description?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          adapter_type?: string;
          code?: string;
          label?: string;
          description?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      commercial_entitlement_definitions: {
        Row: {
          key: string;
          label: string;
          description: string | null;
          value_type: string;
          adapter_id: string | null;
          is_active: boolean;
          default_enabled: boolean;
          default_limit: number | null;
          hard_limit: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          label: string;
          description?: string | null;
          value_type?: string;
          adapter_id?: string | null;
          is_active?: boolean;
          default_enabled?: boolean;
          default_limit?: number | null;
          hard_limit?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          label?: string;
          description?: string | null;
          value_type?: string;
          adapter_id?: string | null;
          is_active?: boolean;
          default_enabled?: boolean;
          default_limit?: number | null;
          hard_limit?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      commercial_plans: {
        Row: {
          id: string;
          code: string;
          version: number;
          name: string;
          description: string | null;
          status: string;
          is_default: boolean;
          price_minor: number | null;
          currency: string;
          billing_period: string;
          row_version: number;
          activated_at: string | null;
          activated_by: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          version: number;
          name: string;
          description?: string | null;
          status?: string;
          is_default?: boolean;
          price_minor?: number | null;
          currency?: string;
          billing_period?: string;
          row_version?: number;
          activated_at?: string | null;
          activated_by?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          version?: number;
          name?: string;
          description?: string | null;
          status?: string;
          is_default?: boolean;
          price_minor?: number | null;
          currency?: string;
          billing_period?: string;
          row_version?: number;
          activated_at?: string | null;
          activated_by?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      commercial_plan_entitlements: {
        Row: {
          plan_id: string;
          entitlement_key: string;
          enabled: boolean;
          limit_value: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          plan_id: string;
          entitlement_key: string;
          enabled?: boolean;
          limit_value?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan_id?: string;
          entitlement_key?: string;
          enabled?: boolean;
          limit_value?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizer_commercial_subscriptions: {
        Row: {
          id: string;
          organizer_user_id: string;
          plan_id: string;
          status: string;
          starts_at: string;
          ends_at: string | null;
          row_version: number;
          assigned_by: string | null;
          cancelled_by: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organizer_user_id: string;
          plan_id: string;
          status?: string;
          starts_at?: string;
          ends_at?: string | null;
          row_version?: number;
          assigned_by?: string | null;
          cancelled_by?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organizer_user_id?: string;
          plan_id?: string;
          status?: string;
          starts_at?: string;
          ends_at?: string | null;
          row_version?: number;
          assigned_by?: string | null;
          cancelled_by?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizer_entitlement_overrides: {
        Row: {
          id: string;
          organizer_user_id: string;
          entitlement_key: string;
          enabled: boolean | null;
          limit_value: number | null;
          reason: string;
          starts_at: string;
          ends_at: string | null;
          row_version: number;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organizer_user_id: string;
          entitlement_key: string;
          enabled?: boolean | null;
          limit_value?: number | null;
          reason: string;
          starts_at?: string;
          ends_at?: string | null;
          row_version?: number;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organizer_user_id?: string;
          entitlement_key?: string;
          enabled?: boolean | null;
          limit_value?: number | null;
          reason?: string;
          starts_at?: string;
          ends_at?: string | null;
          row_version?: number;
          updated_by?: string | null;
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
      seo_provider_connections: {
        Row: {
          id: string;
          provider: "google_search_console" | "yandex_webmaster";
          property_url: string;
          credential_label: string | null;
          vault_secret_id: string;
          status: "configured" | "verified" | "error";
          last_verified_at: string | null;
          last_synced_at: string | null;
          last_error_code: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider: "google_search_console" | "yandex_webmaster";
          property_url: string;
          credential_label?: string | null;
          vault_secret_id: string;
          status?: "configured" | "verified" | "error";
          last_verified_at?: string | null;
          last_synced_at?: string | null;
          last_error_code?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["seo_provider_connections"]["Insert"]>;
        Relationships: [];
      };
      seo_search_performance_daily: {
        Row: {
          id: number;
          provider: "google_search_console" | "yandex_webmaster";
          property_url: string;
          metric_date: string;
          query: string;
          page: string;
          country: string;
          device: string;
          clicks: number;
          impressions: number;
          ctr: number;
          position: number;
          fetched_at: string;
        };
        Insert: {
          id?: number;
          provider: "google_search_console" | "yandex_webmaster";
          property_url: string;
          metric_date: string;
          query?: string;
          page?: string;
          country?: string;
          device?: string;
          clicks?: number;
          impressions?: number;
          ctr?: number;
          position?: number;
          fetched_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["seo_search_performance_daily"]["Insert"]>;
        Relationships: [];
      };
      seo_search_sync_runs: {
        Row: {
          id: string;
          provider: "google_search_console" | "yandex_webmaster";
          status: "running" | "succeeded" | "failed";
          started_at: string;
          finished_at: string | null;
          rows_received: number;
          rows_written: number;
          error_code: string | null;
          triggered_by: "admin" | "cron";
        };
        Insert: {
          id?: string;
          provider: "google_search_console" | "yandex_webmaster";
          status: "running" | "succeeded" | "failed";
          started_at?: string;
          finished_at?: string | null;
          rows_received?: number;
          rows_written?: number;
          error_code?: string | null;
          triggered_by?: "admin" | "cron";
        };
        Update: Partial<Database["public"]["Tables"]["seo_search_sync_runs"]["Insert"]>;
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
      admin_analytics_funnel_counts: {
        Args: { p_since?: string | null };
        Returns: {
          tour_views: number;
          booking_started: number;
          confirmed: number;
          paid: number;
          review: number;
        }[];
      };
      admin_analytics_booking_cohorts: {
        Args: { p_since?: string | null };
        Returns: { month_key: string; bookings: number }[];
      };
      seo_upsert_provider_connection: {
        Args: {
          p_provider: "google_search_console" | "yandex_webmaster";
          p_property_url: string;
          p_secret: string;
          p_credential_label: string;
          p_actor_user_id: string | null;
        };
        Returns: Json;
      };
      seo_delete_provider_connection: {
        Args: {
          p_provider: "google_search_console" | "yandex_webmaster";
          p_actor_user_id: string | null;
        };
        Returns: boolean;
      };
      seo_get_provider_secret: {
        Args: { p_provider: "google_search_console" | "yandex_webmaster" };
        Returns: {
          provider: "google_search_console" | "yandex_webmaster";
          property_url: string;
          credential_label: string | null;
          secret_value: string;
        }[];
      };
      seo_search_performance_summary: {
        Args: { p_days?: number };
        Returns: Json;
      };
      cms_create_document_atomic: {
        Args: {
          p_document_id: string;
          p_doc_type: string;
          p_slug: string;
          p_locale: string;
          p_title: string;
          p_body: Json;
          p_seo: Json;
          p_status: string;
          p_actor_id: string | null;
          p_allow_publish?: boolean;
          p_ip_address?: string | null;
        };
        Returns: Json;
      };
      cms_mutate_document_atomic: {
        Args: {
          p_document_id: string;
          p_expected_version: number;
          p_actor_id: string | null;
          p_operation: string;
          p_allow_publish?: boolean;
          p_title?: string | null;
          p_body?: Json | null;
          p_seo?: Json | null;
          p_target_status?: string | null;
          p_scheduled_publish_at?: string | null;
          p_restore_revision_id?: string | null;
          p_ip_address?: string | null;
        };
        Returns: Json;
      };
      cms_publish_due_scheduled_atomic: {
        Args: { p_limit?: number };
        Returns: Json;
      };
      cms_import_documents_atomic: {
        Args: {
          p_operation_id: string;
          p_payload_hash: string;
          p_items: Json;
          p_actor_id: string | null;
          p_ip_address?: string | null;
        };
        Returns: Json;
      };
      admin_update_site_settings_atomic: {
        Args: {
          p_updates: Json;
          p_actor_user_id: string | null;
          p_actor_kind: string;
          p_ip_address: string | null;
          p_confirmed_risks?: string[];
        };
        Returns: Json;
      };
      admin_assign_staff_atomic: {
        Args: {
          p_actor_user_id: string;
          p_target_user_id: string;
          p_preset: string;
          p_capabilities?: string[];
          p_notes?: string | null;
          p_ip_address?: string | null;
        };
        Returns: Json;
      };
      admin_update_staff_atomic: {
        Args: {
          p_actor_user_id: string;
          p_target_user_id: string;
          p_expected_version: number;
          p_preset: string;
          p_capabilities: string[];
          p_is_active: boolean;
          p_notes: string | null;
          p_ip_address?: string | null;
        };
        Returns: Json;
      };
      admin_remove_staff_atomic: {
        Args: {
          p_actor_user_id: string;
          p_target_user_id: string;
          p_expected_version: number;
          p_ip_address?: string | null;
        };
        Returns: Json;
      };
      attach_guest_bookings_to_current_user: {
        Args: Record<string, never>;
        Returns: number;
      };
      admin_decide_organizer_application: {
        Args: {
          p_application_id: string;
          p_actor_user_id: string;
          p_decision: "approve" | "reject";
          p_review_note?: string | null;
          p_ip_address?: string | null;
        };
        Returns: {
          application_id: string;
          applicant_user_id: string;
          decision_status: "approved" | "rejected";
          decided_at: string;
          changed: boolean;
        }[];
      };
      admin_resolve_blog_comment_report: {
        Args: {
          p_queue_id: string;
          p_report_id: string;
          p_actor_id: string;
          p_action: "hide_comment" | "restore_comment" | "dismiss_report";
          p_expected_queue_status: string;
          p_expected_report_status: string;
          p_expected_comment_status: string;
          p_note?: string | null;
          p_ip_address?: string | null;
        };
        Returns: Json;
      };
      admin_resolve_moderation_item_atomic: {
        Args: {
          p_queue_id: string;
          p_action: "approve" | "reject";
          p_actor_user_id: string;
          p_expected_queue_version: number;
          p_expected_queue_status: string;
          p_expected_entity_version: number;
          p_expected_entity_status: string;
          p_expected_related_version?: number | null;
          p_expected_related_status?: string | null;
          p_note?: string | null;
          p_ip_address?: string | null;
        };
        Returns: Json;
      };
      cancel_booking_with_reservation_release: {
        Args: {
          p_booking_id: string;
          p_expected_updated_at: string;
          p_payload: Json;
          p_updated_at: string;
        };
        Returns: Json;
      };
      admin_transition_booking_atomic: {
        Args: {
          p_booking_id: string;
          p_expected_version: number;
          p_actor_user_id: string;
          p_next_status: string;
          p_note?: string | null;
          p_ip_address?: string | null;
        };
        Returns: Database["public"]["Tables"]["bookings"]["Row"];
      };
      admin_transition_shop_order_atomic: {
        Args: {
          p_order_id: string;
          p_expected_version: number;
          p_actor_user_id: string;
          p_next_status: string;
          p_delivery_url: string | null;
          p_notes: string | null;
          p_ip_address?: string | null;
        };
        Returns: Database["public"]["Tables"]["shop_orders"]["Row"];
      };
      create_booking_with_reservation: {
        Args: {
          p_booking: Json;
          p_slot_date?: string | null;
          p_guests?: number;
        };
        Returns: Json;
      };
      consume_booking_lookup_challenge: {
        Args: {
          p_challenge_id: string;
          p_code_hash: string;
          p_session_token_hash: string;
          p_session_expires_at: string;
        };
        Returns: {
          status: "accepted" | "rejected" | "invalid";
          attempts: number;
        }[];
      };
      prepare_refund_request_atomic: {
        Args: {
          p_booking_id: string;
          p_source_transaction_id: string;
          p_amount: number;
          p_currency: string;
          p_provider: string;
          p_requested_by: string;
          p_request_reason: string | null;
          p_request_idempotency_key: string;
          p_metadata?: Json;
        };
        Returns: Database["public"]["Tables"]["payment_transactions"]["Row"];
      };
      claim_refund_for_execution: {
        Args: {
          p_refund_id: string;
          p_actor_user_id: string;
          p_admin_notes?: string | null;
        };
        Returns: Database["public"]["Tables"]["payment_transactions"]["Row"];
      };
      finalize_refund_attempt: {
        Args: {
          p_refund_id: string;
          p_status: string;
          p_external_id: string | null;
          p_metadata: Json;
          p_booking_fully_refunded?: boolean;
        };
        Returns: Database["public"]["Tables"]["payment_transactions"]["Row"];
      };
      reject_refund_request_atomic: {
        Args: {
          p_refund_id: string;
          p_actor_user_id: string;
          p_admin_notes?: string | null;
        };
        Returns: Database["public"]["Tables"]["payment_transactions"]["Row"];
      };
      create_payout_batch_atomic: {
        Args: {
          p_organizer_user_id: string;
          p_currency: string;
          p_period: string | null;
          p_admin_notes: string | null;
          p_actor_user_id: string;
        };
        Returns: Json;
      };
      approve_payout_batch_atomic: {
        Args: {
          p_payout_id: string;
          p_actor_user_id: string;
          p_admin_notes?: string | null;
        };
        Returns: Database["public"]["Tables"]["payout_records"]["Row"];
      };
      mark_payout_exported_atomic: {
        Args: {
          p_payout_id: string;
          p_actor_user_id: string;
          p_export_file_hash: string;
        };
        Returns: Database["public"]["Tables"]["payout_records"]["Row"];
      };
      complete_payout_batch_atomic: {
        Args: {
          p_payout_id: string;
          p_actor_user_id: string;
          p_admin_notes?: string | null;
        };
        Returns: Database["public"]["Tables"]["payout_records"]["Row"];
      };
      cancel_payout_batch_atomic: {
        Args: {
          p_payout_id: string;
          p_actor_user_id: string;
          p_admin_notes?: string | null;
        };
        Returns: Database["public"]["Tables"]["payout_records"]["Row"];
      };
      commercial_create_plan_version: {
        Args: {
          p_code: string;
          p_name: string;
          p_description: string | null;
          p_price_minor: number | null;
          p_currency: string;
          p_billing_period: string;
          p_clone_from_plan_id: string | null;
          p_actor_user_id: string;
        };
        Returns: Database["public"]["Tables"]["commercial_plans"]["Row"];
      };
      commercial_update_draft_plan: {
        Args: {
          p_plan_id: string;
          p_expected_version: number;
          p_name: string;
          p_description: string | null;
          p_price_minor: number | null;
          p_currency: string;
          p_billing_period: string;
          p_actor_user_id: string;
        };
        Returns: Database["public"]["Tables"]["commercial_plans"]["Row"];
      };
      commercial_set_plan_entitlement: {
        Args: {
          p_plan_id: string;
          p_expected_version: number;
          p_entitlement_key: string;
          p_enabled: boolean;
          p_limit_value: number | null;
          p_actor_user_id: string;
        };
        Returns: Database["public"]["Tables"]["commercial_plans"]["Row"];
      };
      commercial_activate_plan: {
        Args: {
          p_plan_id: string;
          p_expected_version: number;
          p_make_default: boolean;
          p_actor_user_id: string;
        };
        Returns: Database["public"]["Tables"]["commercial_plans"]["Row"];
      };
      commercial_retire_plan: {
        Args: {
          p_plan_id: string;
          p_expected_version: number;
          p_actor_user_id: string;
        };
        Returns: Database["public"]["Tables"]["commercial_plans"]["Row"];
      };
      commercial_assign_organizer_plan: {
        Args: {
          p_organizer_user_id: string;
          p_plan_id: string;
          p_expected_subscription_version: number;
          p_starts_at: string | null;
          p_ends_at: string | null;
          p_actor_user_id: string;
        };
        Returns: Database["public"]["Tables"]["organizer_commercial_subscriptions"]["Row"];
      };
      commercial_upsert_organizer_override: {
        Args: {
          p_organizer_user_id: string;
          p_entitlement_key: string;
          p_enabled: boolean | null;
          p_limit_value: number | null;
          p_reason: string;
          p_ends_at: string | null;
          p_expected_version: number;
          p_actor_user_id: string;
        };
        Returns: Database["public"]["Tables"]["organizer_entitlement_overrides"]["Row"];
      };
      commercial_delete_organizer_override: {
        Args: {
          p_override_id: string;
          p_expected_version: number;
          p_actor_user_id: string;
        };
        Returns: string;
      };
      organizer_mutate_tour_atomic: {
        Args: {
          p_tour_id: string;
          p_actor_user_id: string;
          p_expected_version: number;
          p_operation: "save" | "submit" | "archive";
          p_market_code: string;
          p_product_type: "tour" | "excursion";
          p_slug: string;
          p_title: string;
          p_listing: Json;
          p_payload: Json;
          p_editor_draft: Json;
          p_ip_address?: string | null;
        };
        Returns: Json;
      };
      admin_unpublish_tour_atomic: {
        Args: {
          p_tour_id: string;
          p_expected_version: number;
          p_actor_user_id: string;
          p_action: "unpublish" | "archive";
          p_ip_address?: string | null;
        };
        Returns: Json;
      };
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
      content_publication_gate: {
        Args: { p_document_id: string };
        Returns: Json;
      };
      content_factory_upsert_connection: {
        Args: {
          p_project_key: string;
          p_provider: string;
          p_label: string;
          p_external_account_id: string;
          p_handle: string;
          p_config: Json;
          p_secret_values: Json;
          p_actor_user_id: string | null;
        };
        Returns: Json;
      };
      content_factory_get_connection_credentials: {
        Args: { p_provider: string; p_project_key?: string };
        Returns: {
          connection_id: string;
          provider: string;
          external_account_id: string | null;
          handle: string | null;
          config: Json;
          secrets: Json;
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
