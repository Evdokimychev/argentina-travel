"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Loader2, MessageCircle, SendHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { isGuideAssistantPath } from "@/lib/guide-assistant-path";
import type { GuideAssistantResponse, GuideAssistantSource } from "@/types/guide-assistant";

const SESSION_STORAGE_KEY = "guide-assistant-session-id";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: GuideAssistantSource[];
  mode?: GuideAssistantResponse["mode"];
};

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const created =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sess-${Date.now()}`;
    window.localStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return `sess-${Date.now()}`;
  }
}

function SourceLinks({ sources }: { sources: GuideAssistantSource[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-3 space-y-2 border-t border-border-subtle pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Источники</p>
      <ul className="space-y-2">
        {sources.map((source) => (
          <li key={source.id}>
            <Link
              href={source.url}
              className="block rounded-lg border border-border-subtle bg-surface-muted/40 px-3 py-2 text-sm transition-colors hover:border-sky/30 hover:bg-sky/5"
            >
              <span className="font-medium text-foreground">{source.title}</span>
              {source.snippet ? (
                <span className="mt-1 block line-clamp-2 text-xs text-muted">{source.snippet}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AssistantMessage({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? (
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky/15 text-sky"
          aria-hidden
        >
          <Bot className="h-4 w-4" strokeWidth={1.75} />
        </div>
      ) : null}
      <div
        className={cn(
          "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[85%]",
          isUser
            ? "bg-sky text-white"
            : "border border-border-subtle bg-surface-elevated text-foreground shadow-sm"
        )}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
        {!isUser && message.sources ? <SourceLinks sources={message.sources} /> : null}
        {!isUser && message.mode === "search_fallback" ? (
          <p className="mt-2 text-xs text-muted">
            Ответ составлен по результатам поиска по сайту.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function GuideAssistantWidget() {
  const pathname = usePathname();
  const visible = isGuideAssistantPath(pathname);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaId = useId();

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, loading]);

  const ask = useCallback(async () => {
    const question = input.trim();
    if (!question || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/assistant/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
          sessionId: getOrCreateSessionId(),
        }),
      });

      const payload = (await response.json()) as GuideAssistantResponse & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось получить ответ.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: payload.answer,
          sources: payload.sources,
          mode: payload.mode,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось получить ответ.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  if (!visible) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed right-3 z-[88] flex h-12 w-12 items-center justify-center rounded-full border border-sky/25",
          "bg-sky text-white shadow-elevated transition-transform hover:scale-[1.03] hover:bg-sky-dark",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 focus-visible:ring-offset-2",
          "bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] sm:bottom-6"
        )}
        aria-label="Открыть помощник по материалам сайта"
      >
        <MessageCircle className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="flex max-h-[min(92vh,720px)] w-full flex-col p-0 sm:max-w-lg"
          showClose={false}
          aria-describedby={`${textareaId}-desc`}
        >
          <DialogHeader className="shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-sky" strokeWidth={1.75} aria-hidden />
                  Помощник по Аргентине
                </DialogTitle>
                <DialogDescription id={`${textareaId}-desc`} className="mt-1">
                  Ответы по материалам путеводителя, блога и раздела об иммиграции. По визам и
                  правилам въезда уточняйте актуальные данные перед поездкой.
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
                aria-label="Закрыть"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </DialogHeader>

          <DialogBody className="flex min-h-0 flex-1 flex-col gap-0 p-0">
            <div
              ref={listRef}
              className="flex max-h-[min(52vh,420px)] flex-col gap-4 overflow-y-auto px-5 py-4 sm:px-6"
              aria-live="polite"
            >
              {messages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border-subtle bg-surface-muted/30 px-4 py-5 text-sm text-muted">
                  <p className="font-medium text-foreground">Примеры вопросов</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Нужна ли виза россиянам для туристической поездки?</li>
                    <li>Как добраться из Буэнос-Айреса в Патагонию?</li>
                    <li>Какие документы нужны для оформления DNI?</li>
                  </ul>
                </div>
              ) : null}

              {messages.map((message) => (
                <AssistantMessage key={message.id} message={message} />
              ))}

              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Ищем материалы и готовим ответ…
                </div>
              ) : null}
            </div>

            {error ? (
              <p className="px-5 text-sm text-error sm:px-6" role="alert">
                {error}
              </p>
            ) : null}

            <div className="border-t border-border-subtle px-5 py-4 sm:px-6">
              <label htmlFor={textareaId} className="sr-only">
                Ваш вопрос
              </label>
              <Textarea
                id={textareaId}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void ask();
                  }
                }}
                placeholder="Спросите о поездке, визах или жизни в Аргентине…"
                rows={3}
                disabled={loading}
                className="min-h-[88px] resize-none bg-surface-elevated"
              />
            </div>
          </DialogBody>

          <DialogFooter className="shrink-0">
            <Button
              type="button"
              variant="primary"
              onClick={() => void ask()}
              disabled={loading || !input.trim()}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <SendHorizontal className="h-4 w-4" aria-hidden />
              )}
              Спросить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
