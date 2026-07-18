import "server-only";

import type { EmailLayoutOptions, EmailTemplateResult } from "@/lib/notifications/email-templates/types";
import {
  renderConstrainedEmailTemplate,
  type EmailTemplateEventKey,
  type EmailTemplateVariables,
} from "@/lib/notifications/email-template-contract";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ManagedTemplateRow = {
  event_key: string;
  locale: string;
  subject_template: string;
  body_blocks: unknown;
};

/**
 * Resolve only a checked active template. Missing, stale or malformed database
 * content falls back to the code-owned transactional template so delivery is
 * never broken by an editor mistake.
 */
export async function resolveManagedEmailTemplate<K extends EmailTemplateEventKey>(input: {
  eventKey: K;
  locale: string;
  variables: EmailTemplateVariables<K>;
  fallback: EmailTemplateResult;
  layoutOptions?: EmailLayoutOptions;
}): Promise<EmailTemplateResult> {
  try {
    const supabase = createSupabaseAdminClient();
    // The generated database types intentionally lag additive migrations in this package.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("email_template_versions")
      .select("event_key, locale, subject_template, body_blocks")
      .eq("event_key", input.eventKey)
      .eq("locale", input.locale)
      .eq("status", "active")
      .maybeSingle();
    if (error || !data) return input.fallback;
    const row = data as ManagedTemplateRow;
    if (row.event_key !== input.eventKey || row.locale !== input.locale) return input.fallback;
    return (
      renderConstrainedEmailTemplate({
        eventKey: input.eventKey,
        locale: input.locale,
        subjectTemplate: row.subject_template,
        bodyBlocks: row.body_blocks,
        variables: input.variables,
        layoutOptions: input.layoutOptions,
      }) ?? input.fallback
    );
  } catch {
    return input.fallback;
  }
}
