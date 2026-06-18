import type { PodborAnswers, PodborSession } from "@/types/podbor";

const STORAGE_KEY = "podbor-session-v1";

const EMPTY_SESSION: PodborSession = {
  answers: {},
  currentQuestionId: null,
  completedAt: null,
  updatedAt: new Date(0).toISOString(),
};

export function loadPodborSession(): PodborSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PodborSession;
  } catch {
    return null;
  }
}

export function savePodborSession(session: PodborSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...session, updatedAt: new Date().toISOString() })
  );
}

export function clearPodborSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function createPodborSession(answers: PodborAnswers = {}): PodborSession {
  return { ...EMPTY_SESSION, answers, updatedAt: new Date().toISOString() };
}
