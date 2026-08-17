"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PodborOptionCard from "./PodborOptionCard";
import {
  canProceed,
  toggleOption,
} from "@/lib/podbor/flow";
import type { PodborQuestion } from "@/types/podbor";

interface PodborQuestionScreenProps {
  question: PodborQuestion;
  selected: string[];
  onChange: (next: string[]) => void;
  onContinue: () => void;
  onBack?: () => void;
  canGoBack: boolean;
}

export default function PodborQuestionScreen({
  question,
  selected,
  onChange,
  onContinue,
  onBack,
  canGoBack,
}: PodborQuestionScreenProps) {
  const ready = canProceed(question, selected);
  const numericValue = question.numericInput
    ? Number(selected[0] ?? question.numericInput.defaultValue)
    : null;
  const isCompactGrid =
    question.id === "duration" ||
    question.id === "budget" ||
    question.id === "travelers" ||
    question.id === "activity";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -24 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-3xl px-4 pb-28 pt-8 sm:px-6 sm:pt-10"
      >
        <div className="mb-8">
          <motion.h1
            className="font-heading text-2xl font-bold leading-tight text-charcoal sm:text-3xl"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            {question.title}
          </motion.h1>
          {question.subtitle ? (
            <motion.p
              className="mt-3 max-w-2xl text-base leading-relaxed text-slate"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {question.subtitle}
            </motion.p>
          ) : null}
          {question.selectionMode === "multi" && question.maxSelections ? (
            <p className="mt-2 text-sm text-slate">
              Можно выбрать до {question.maxSelections}
            </p>
          ) : null}
        </div>

        {question.numericInput && numericValue != null ? (
          <div className="flex items-center justify-center gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-card">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Уменьшить количество путешественников"
              disabled={numericValue <= question.numericInput.min}
              onClick={() => onChange([String(Math.max(question.numericInput!.min, numericValue - 1))])}
            >
              <Minus className="h-5 w-5" aria-hidden />
            </Button>
            <output
              aria-live="polite"
              className="min-w-28 text-center font-heading text-3xl font-bold tabular-nums text-charcoal"
            >
              {numericValue} {numericValue === 1 ? "человек" : numericValue < 5 ? "человека" : "человек"}
            </output>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Увеличить количество путешественников"
              disabled={numericValue >= question.numericInput.max}
              onClick={() => onChange([String(Math.min(question.numericInput!.max, numericValue + 1))])}
            >
              <Plus className="h-5 w-5" aria-hidden />
            </Button>
          </div>
        ) : (
        <div
          className={
            isCompactGrid
              ? "grid gap-3 sm:grid-cols-2"
              : "grid gap-4 sm:grid-cols-2"
          }
        >
          {question.options.map((option, index) => (
            <PodborOptionCard
              key={option.id}
              option={option}
              selected={selected.includes(option.id)}
              selectionMode={question.selectionMode}
              index={index}
              onSelect={() =>
                onChange(toggleOption(question, selected, option.id))
              }
            />
          ))}
        </div>
        )}

        <div className="fixed inset-x-0 z-40 border-t border-border-subtle bg-surface-elevated/95 backdrop-blur-md transition-[bottom] duration-200 [bottom:calc(var(--cookie-consent-offset,0px)+var(--public-mobile-nav-height,0px))]">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:px-6">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!canGoBack}
              onClick={onBack}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Назад
            </Button>

            <Button
              type="button"
              disabled={!ready}
              onClick={onContinue}
              className="min-w-[140px]"
            >
              Продолжить
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
