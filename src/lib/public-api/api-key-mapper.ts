import type { PublicApiKeyRecord } from "@/types/public-api";

export type ApiKeyDbRow = {
  id: string;
  key_prefix: string;
  label: string;
  partner_name: string | null;
  organizer_id: string | null;
  scopes: string[] | null;
  rate_limit_per_minute: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
};

export function mapApiKeyRow(row: ApiKeyDbRow): PublicApiKeyRecord {
  return {
    id: row.id,
    keyPrefix: row.key_prefix,
    label: row.label,
    partnerName: row.partner_name,
    organizerId: row.organizer_id,
    scopes: (row.scopes ?? []) as PublicApiKeyRecord["scopes"],
    rateLimitPerMinute: row.rate_limit_per_minute,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    revokedAt: row.revoked_at,
    lastUsedAt: row.last_used_at,
  };
}

export const API_KEY_SELECT_COLUMNS =
  "id, key_prefix, label, partner_name, organizer_id, scopes, rate_limit_per_minute, is_active, created_at, updated_at, revoked_at, last_used_at";
