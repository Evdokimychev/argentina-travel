"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Compass, Sparkles } from "lucide-react";
import type { TourListing } from "@/types";
import type { ExcursionListing } from "@/types/excursion";
import type { PodborAnswers, PodborQuestionId, PodborMatchResult } from "@/types/podbor";
import PodborProgressBar from "./PodborProgressBar";
import PodborQuestionScreen from "./PodborQuestionScreen";
import PodborResultsView from "./PodborResultsView";
import PodborTourMatchChat from "./PodborTourMatchChat";
import { Button } from "@/components/ui/button";
import {
  buildPodborFlow,
  getFlowProgress,
  getQuestionForDisplay,
  resolveActiveQuestion,
} from "@/lib/podbor/flow";
import { buildPodborMatchResult } from "@/lib/podbor/matching";
import {
  clearPodborSession,
  loadPodborSession,
  savePodborSession,
} from "@/lib/podbor/storage";

interface PodborViewProps {
  tours: TourListing[];
}

type Phase = "intro" | "quiz" | "results";

export default function PodborView({ tours }: PodborViewProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [answers, setAnswers] = useState<PodborAnswers>({});
  const [draftSelection, setDraftSelection] = useState<string[]>([]);
  const [result, setResult] = useState<PodborMatchResult | null>(null);
  const [excursions, setExcursions] = useState<ExcursionListing[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const activeQuestionId = useMemo(
    () => resolveActiveQuestion(answers),
    [answers]
  );

  const progress = useMemo(
    () => getFlowProgress(answers, activeQuestionId),
    [answers, activeQuestionId]
  );

  const currentQuestion = activeQuestionId
    ? getQuestionForDisplay(activeQuestionId, answers)
    : null;

  useEffect(() => {
    const saved = loadPodborSession();
    if (saved?.completedAt && Object.keys(saved.answers).length > 0) {
      setAnswers(saved.answers);
      const match = buildPodborMatchResult(saved.answers, tours);
      setResult(match);
      setPhase("results");
    } else if (saved?.answers && Object.keys(saved.answers).length > 0) {
      setAnswers(saved.answers);
      setPhase("quiz");
    }
    setHydrated(true);
  }, [tours]);

  useEffect(() => {
    if (!activeQuestionId) return;
    setDraftSelection(answers[activeQuestionId] ?? []);
  }, [activeQuestionId, answers]);

  useEffect(() => {
    if (!hydrated) return;
    savePodborSession({
      answers,
      currentQuestionId: activeQuestionId,
      completedAt: phase === "results" ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    });
  }, [answers, activeQuestionId, phase, hydrated]);

  useEffect(() => {
    if (phase !== "results") return;
    fetch("/api/excursions?pageSize=40")
      .then((res) => res.json())
      .then((data: { items?: ExcursionListing[] }) => {
        setExcursions(data.items ?? []);
      })
      .catch(() => setExcursions([]));
  }, [phase]);

  useEffect(() => {
    if (phase !== "results" || excursions.length === 0) return;
    setResult(buildPodborMatchResult(answers, tours, excursions));
  }, [phase, excursions, answers, tours]);

  const handleContinue = useCallback(() => {
    if (!activeQuestionId || !currentQuestion) return;
    const nextAnswers = { ...answers, [activeQuestionId]: draftSelection };
    setAnswers(nextAnswers);

    const nextActive = resolveActiveQuestion(nextAnswers);
    if (!nextActive) {
      const match = buildPodborMatchResult(nextAnswers, tours, excursions);
      setResult(match);
      setPhase("results");
    }
  }, [activeQuestionId, answers, currentQuestion, draftSelection, excursions, tours]);

  const handleBack = useCallback(() => {
    if (!activeQuestionId) return;
    const flow = buildPodborFlow(answers);
    const index = flow.indexOf(activeQuestionId);
    if (index <= 0) return;

    const prevId = flow[index - 1];
    const trimmed = { ...answers };
    for (let i = index; i < flow.length; i += 1) {
      delete trimmed[flow[i]];
    }
    setAnswers(trimmed);
    setDraftSelection(trimmed[prevId] ?? []);
  }, [activeQuestionId, answers]);

  const handleRestart = useCallback(() => {
    clearPodborSession();
    setAnswers({});
    setDraftSelection([]);
    setResult(null);
    setPhase("intro");
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky border-t-transparent" />
      </div>
    );
  }

  if (phase === "results" && result) {
    return (
      <div>
        <PodborResultsView result={result} onRestart={handleRestart} />
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <PodborTourMatchChat className="mt-8" />
        </div>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky/5 via-transparent to-pampas/40" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6"
        >
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-sky">
            <Sparkles className="h-4 w-4" aria-hidden />
            Персональный подбор
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold leading-tight text-charcoal sm:text-5xl">
            Подберём маршрут по Аргентине за 2 минуты
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate">
            Ответьте на несколько вопросов — как с живым консультантом. Мы учтём цель поездки,
            интересы, бюджет и темп, а затем предложим регионы, туры и экскурсии.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button type="button" size="lg" onClick={() => setPhase("quiz")}>
              <Compass className="h-5 w-5" aria-hidden />
              Начать подбор
            </Button>
            {Object.keys(answers).length > 0 ? (
              <Button type="button" size="lg" variant="outline" onClick={() => setPhase("quiz")}>
                Продолжить с сохранённого
              </Button>
            ) : null}
          </div>

          <div className="mt-12">
            <PodborTourMatchChat />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-white via-surface-muted/30 to-pampas/30">
      <PodborProgressBar
        percent={progress.percent}
        current={progress.current}
        total={progress.total}
      />

      <AnimatePresence mode="wait">
        {currentQuestion ? (
          <PodborQuestionScreen
            key={currentQuestion.id}
            question={currentQuestion}
            selected={draftSelection}
            onChange={setDraftSelection}
            onContinue={handleContinue}
            onBack={handleBack}
            canGoBack={progress.current > 1}
          />
        ) : null}
      </AnimatePresence>

      <div className="mx-auto max-w-3xl px-4 pb-12 sm:px-6">
        <PodborTourMatchChat compact className="mt-6" />
      </div>
    </div>
  );
}
