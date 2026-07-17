export function jsonDraftsEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function mergeServerDraftsPreservingDirty<T>(
  drafts: Record<string, T>,
  baselines: Record<string, T>,
  serverValues: Record<string, T>,
): { drafts: Record<string, T>; baselines: Record<string, T> } {
  const nextDrafts = { ...drafts };

  for (const [key, serverValue] of Object.entries(serverValues)) {
    const previousBaseline = baselines[key];
    const currentDraft = drafts[key];
    const isLocallyDirty =
      previousBaseline !== undefined &&
      currentDraft !== undefined &&
      !jsonDraftsEqual(currentDraft, previousBaseline);

    if (!isLocallyDirty) {
      nextDrafts[key] = serverValue;
    }
  }

  return {
    drafts: nextDrafts,
    baselines: { ...baselines, ...serverValues },
  };
}
