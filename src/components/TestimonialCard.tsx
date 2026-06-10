import Link from "next/link";
import { Testimonial } from "@/types";
import { StarRating } from "@/components/ui/star-rating";

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export default function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <StarRating stars={testimonial.rating} size="lg" />
        {testimonial.verifiedTrip ? (
          <span className="rounded-full bg-sky/10 px-2 py-0.5 text-[11px] font-medium text-sky">
            Проверенная поездка
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-slate italic">&ldquo;{testimonial.text}&rdquo;</p>
      <div className="mt-4">
        <p className="font-semibold text-charcoal">{testimonial.name}</p>
        <p className="text-sm text-slate">{testimonial.location}</p>
        {testimonial.tourSlug && testimonial.tourTitle ? (
          <Link
            href={`/tours/${testimonial.tourSlug}#reviews`}
            className="mt-2 inline-block text-xs font-medium text-brand hover:underline"
          >
            {testimonial.tourTitle}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
