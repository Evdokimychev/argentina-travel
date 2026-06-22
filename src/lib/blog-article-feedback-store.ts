export type BlogArticleFeedbackValue = "helpful" | "not_helpful";

export const BLOG_ARTICLE_FEEDBACK_KEY = "argentina-travel-blog-feedback-v1";

type FeedbackRecord = Record<string, BlogArticleFeedbackValue>;

function storage(): Storage | null {
  if (typeof globalThis.localStorage === "undefined") return null;
  return globalThis.localStorage;
}

function readRaw(): FeedbackRecord {
  const store = storage();
  if (!store) return {};
  try {
    const raw = store.getItem(BLOG_ARTICLE_FEEDBACK_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as FeedbackRecord;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRaw(records: FeedbackRecord) {
  const store = storage();
  if (!store) return;
  store.setItem(BLOG_ARTICLE_FEEDBACK_KEY, JSON.stringify(records));
}

export function getBlogArticleFeedback(slug: string): BlogArticleFeedbackValue | null {
  return readRaw()[slug] ?? null;
}

export function setBlogArticleFeedback(slug: string, value: BlogArticleFeedbackValue): void {
  const records = readRaw();
  records[slug] = value;
  writeRaw(records);
}
