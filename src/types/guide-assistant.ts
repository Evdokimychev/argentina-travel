export type GuideAssistantSource = {
  id: string;
  title: string;
  url: string;
  kind: string;
  snippet: string;
};

export type GuideAssistantMode = "ai" | "search_fallback";

export type GuideAssistantResponse = {
  answer: string;
  sources: GuideAssistantSource[];
  mode: GuideAssistantMode;
  aiConfigured: boolean;
};

export type GuideAssistantAskRequest = {
  question: string;
  pageUrl?: string;
  sessionId?: string;
};
