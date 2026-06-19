"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { getOrCreateTourMatchSessionId } from "@/lib/podbor/tour-match-client";
import PodborMatchedTourCard from "./PodborMatchedTourCard";
import type { MatchedTourResult, TourMatchResponse } from "@/types/tour-match";

type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  text: string;
  tours?: MatchedTourResult[];
  mode?: TourMatchResponse["mode"];
};

const EXAMPLE_PROMPTS = [
  "Семейная поездка в Патагонию на 7–10 дней, бюджет до 2000 $",
  "Спокойный тур по винным регионам на пару",
  "Активный треккинг на 5 дней, готовы к нагрузке",
];

interface PodborTourMatchChatProps {
  className?: string;
  compact?: boolean;
}

export default function PodborTourMatchChat({ className, compact = false }: PodborTourMatchChatProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaId = useId();

  useEffect(() => {
    setSessionId(getOrCreateTourMatchSessionId());
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, loading]);

  const submit = useCallback(async () => {
    const query = input.trim();
    if (!query || loading) return;

    setTurns((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", text: query },
    ]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/tour-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          sessionId: sessionId ?? getOrCreateTourMatchSessionId(),
        }),
      });

      const payload = (await response.json()) as TourMatchResponse & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Не удалось подобрать туры.");
      }

      if (payload.sessionId) {
        setSessionId(payload.sessionId);
      }

      setTurns((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: payload.explanation,
          tours: payload.tours,
          mode: payload.mode,
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось подобрать туры.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [input, loading, sessionId]);

  const applyExample = (example: string) => {
    setInput(example);
  };

  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card",
        compact ? "min-h-[28rem]" : "min-h-[32rem]",
        className
      )}
      aria-label="Чат подбора тура"
    >
      <header className="border-b border-gray-100 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky/15 text-sky"
            aria-hidden
          >
            <Bot className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-charcoal">Умный подбор тура</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate">
              Опишите поездку своими словами — подберём туры из каталога и объясним, почему они
              подходят. Цены и даты уточняйте на странице тура.
            </p>
          </div>
          <MessageCircle className="ml-auto hidden h-5 w-5 shrink-0 text-sky/60 sm:block" aria-hidden />
        </div>
      </header>

      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-5"
        aria-live="polite"
      >
        {turns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-surface-muted/30 px-4 py-4">
            <p className="text-sm font-medium text-charcoal">Примеры запросов</p>
            <ul className="mt-3 space-y-2">
              {EXAMPLE_PROMPTS.map((example) => (
                <li key={example}>
                  <button
                    type="button"
                    onClick={() => applyExample(example)}
                    className="w-full rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-left text-sm text-slate transition-colors hover:border-sky/30 hover:bg-sky/5"
                  >
                    {example}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {turns.map((turn) => (
          <div key={turn.id} className={cn("flex flex-col gap-3", turn.role === "user" && "items-end")}>
            <div
              className={cn(
                "max-w-[95%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[85%]",
                turn.role === "user"
                  ? "bg-sky text-white"
                  : "border border-gray-100 bg-surface-muted/40 text-charcoal"
              )}
            >
              <p className="whitespace-pre-wrap">{turn.text}</p>
              {turn.role === "assistant" && turn.mode === "rule_based" ? (
                <p className="mt-2 text-xs text-slate">
                  Подбор по правилам каталога — без генеративного ИИ.
                </p>
              ) : null}
            </div>

            {turn.role === "assistant" && turn.tours && turn.tours.length > 0 ? (
              <div className="w-full space-y-3">
                {turn.tours.map((match) => (
                  <PodborMatchedTourCard key={`${turn.id}-${match.tour.slug}`} match={match} />
                ))}
              </div>
            ) : null}
          </div>
        ))}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Подбираем туры по каталогу…
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="px-4 text-sm text-error sm:px-5" role="alert">
          {error}
        </p>
      ) : null}

      <div className="border-t border-gray-100 px-4 py-4 sm:px-5">
        <label htmlFor={textareaId} className="sr-only">
          Ваш запрос о туре
        </label>
        <Textarea
          id={textareaId}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder="Например: семья с ребёнком 8 лет, Патагония, до 2500 $, 8–10 дней…"
          rows={compact ? 2 : 3}
          disabled={loading}
          className="min-h-[72px] resize-none bg-white"
        />
        <div className="mt-3 flex justify-end">
          <Button type="button" onClick={() => void submit()} disabled={loading || !input.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <SendHorizontal className="h-4 w-4" aria-hidden />
            )}
            Подобрать
          </Button>
        </div>
      </div>
    </section>
  );
}
