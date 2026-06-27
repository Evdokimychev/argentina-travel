"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Testimonial } from "@/types";
import TestimonialCard from "@/components/TestimonialCard";
import SectionShell from "@/components/layout/SectionShell";

interface HomeTestimonialsSectionProps {
  testimonials: Testimonial[];
}

export default function HomeTestimonialsSection({ testimonials }: HomeTestimonialsSectionProps) {
  if (testimonials.length === 0) {
    return null;
  }

  return (
    <SectionShell
      reveal
      tone="muted"
      eyebrow="Доверие"
      title="Отзывы путешественников"
      subtitle="Публикуем только отзывы после реальных поездок — без накрутки и стоковых фото"
      className="border-y border-gray-100"
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((item) => (
          <TestimonialCard key={item.id} testimonial={item} />
        ))}
      </div>
      {testimonials.length < 3 ? (
        <p className="mt-6 text-center text-sm text-slate">
          <Link href="/tours" className="font-medium text-sky hover:underline">
            Выберите тур и поделитесь впечатлениями
            <ArrowRight className="ml-0.5 inline h-3.5 w-3.5" aria-hidden />
          </Link>
        </p>
      ) : null}
    </SectionShell>
  );
}
