/** Stale typing rows older than this are ignored on read (active presence). */
export const TYPING_PRESENCE_TTL_SECONDS = 10;

/**
 * Housekeeping delete window for the daily platform-maintenance cron.
 * Correctness of "is typing" must come from TYPING_PRESENCE_TTL_SECONDS on read;
 * this larger window only limits table growth under Hobby daily scheduling.
 */
export const TYPING_PRESENCE_CLEANUP_TTL_SECONDS = 15 * 60;
