"use client";

import Link from "next/link";
import { ArrowRight, MessageCircleHeart } from "lucide-react";
import type { Testimonial } from "@/types";
import TestimonialCard from "@/components/TestimonialCard";
import SectionShell from "@/components/layout/SectionShell";
import { EmptyState } from "@/components/ui/empty-state";

interface HomeTestimonialsSectionProps {
  testimonials: Testimonial[];
}

export default function HomeTestimonialsSection({ testimonials }: HomeTestimonialsSectionProps) {
  const hasVerified = testimonials.length >= 1;

  return (
    <SectionShell
      reveal
      tone="muted"
      eyebrow="Доверие"
      title="Отзывы путешественников"
      subtitle="Публикуем только отзывы после реальных поездок — без накрутки и стоковых фото"
      className="border-y border-gray-100"
    >
      {hasVerified ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item) => (
            <TestimonialCard key={item.id} testimonial={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MessageCircleHeart}
          title="Первые отзывы скоро"
          description="Платформа молодая: как только путешественники вернутся из поездок, здесь появятся их истории и оценки."
          action={{ label: "Смотреть каталог туров", href: "/tours", variant: "primary" }}
          secondaryAction={{
            label: "Как мы работаем с отзывами",
            href: "/about",
            variant: "outline",
          }}
          bordered
          variant="catalog"
        />
      )}
      {hasVerified && testimonials.length < 3 ? (
        <p className="mt-6 text-center text-sm text-slate">
          Скоро добавим больше историй —{" "}
          <Link href="/tours" className="font-medium text-sky hover:underline">
            выберите тур и станьте первым
            <ArrowRight className="ml-0.5 inline h-3.5 w-3.5" aria-hidden />
          </Link>
        </p>
      ) : null}
    </SectionShell>
  );
}
