import type { OrganizerTourDraft } from "@/types/organizer-tour";
import {
  OrganizerDraftConflictError,
  patchOrganizerTourDraftRemote,
} from "@/lib/organizer-tour-draft-api";

const DRAFT_SYNC_QUEUE_KEY = "argentina-travel-organizer-tour-draft-sync-queue-v2";

export interface OrganizerTourDraftSyncQueueItem {
  tourId: string;
  draft: OrganizerTourDraft;
  expectedUpdatedAt: string | null;
  queuedAt: string;
}

export type OrganizerTourDraftQueueFlushResult =
  | { tourId: string; status: "synced"; updatedAt: string | null }
  | { tourId: string; status: "conflict"; serverUpdatedAt: string | null }
  | { tourId: string; status: "failed"; error: string };

function readQueueMap(): Record<string, OrganizerTourDraftSyncQueueItem> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(DRAFT_SYNC_QUEUE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, OrganizerTourDraftSyncQueueItem>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeQueueMap(map: Record<string, OrganizerTourDraftSyncQueueItem>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFT_SYNC_QUEUE_KEY, JSON.stringify(map));
}

export function enqueueOrganizerTourDraftSync(
  item: Omit<OrganizerTourDraftSyncQueueItem, "queuedAt">
) {
  const queue = readQueueMap();
  queue[item.tourId] = {
    ...item,
    queuedAt: new Date().toISOString(),
  };
  writeQueueMap(queue);
}

export function clearOrganizerTourDraftSync(tourId: string) {
  const queue = readQueueMap();
  if (!queue[tourId]) return;
  delete queue[tourId];
  writeQueueMap(queue);
}

export function hasQueuedOrganizerTourDraftSync(tourId: string): boolean {
  const queue = readQueueMap();
  return Boolean(queue[tourId]);
}

export async function flushOrganizerTourDraftSyncQueue(
  onlyTourId?: string
): Promise<OrganizerTourDraftQueueFlushResult[]> {
  if (typeof window === "undefined") return [];
  if (typeof navigator !== "undefined" && !navigator.onLine) return [];

  const queue = readQueueMap();
  const items = Object.values(queue)
    .filter((item) => (onlyTourId ? item.tourId === onlyTourId : true))
    .sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));

  if (!items.length) return [];

  const results: OrganizerTourDraftQueueFlushResult[] = [];
  let changed = false;

  for (const item of items) {
    try {
      const synced = await patchOrganizerTourDraftRemote({
        tourId: item.tourId,
        draft: item.draft,
        expectedUpdatedAt: item.expectedUpdatedAt,
      });
      delete queue[item.tourId];
      changed = true;
      results.push({
        tourId: item.tourId,
        status: "synced",
        updatedAt: synced.updatedAt ?? item.draft.updatedAt ?? null,
      });
    } catch (error) {
      if (error instanceof OrganizerDraftConflictError) {
        delete queue[item.tourId];
        changed = true;
        results.push({
          tourId: item.tourId,
          status: "conflict",
          serverUpdatedAt: error.serverUpdatedAt,
        });
        continue;
      }

      results.push({
        tourId: item.tourId,
        status: "failed",
        error: error instanceof Error ? error.message : "Не удалось синхронизировать черновик",
      });
      break;
    }
  }

  if (changed) {
    writeQueueMap(queue);
  }

  return results;
}
