import Image from "next/image";
import type { OrganizerTourGuide } from "@/types/organizer-tour";
import { SectionHeading } from "./InfoModal";

interface GuidesSectionProps {
  guides: OrganizerTourGuide[];
}

export default function GuidesSection({ guides }: GuidesSectionProps) {
  const visible = guides.filter((guide) => guide.name.trim());
  if (visible.length === 0) return null;

  return (
    <section id="guides" className="tour-section-target">
      <SectionHeading
        title="Гиды и сопровождение"
        subtitle="Команда, которая проведёт вас по маршруту"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {visible.map((guide) => (
          <article
            key={guide.id}
            className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
              {guide.avatar ? (
                <Image
                  src={guide.avatar}
                  alt={guide.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-slate">
                  {guide.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-charcoal">{guide.name}</h3>
                {guide.isTourAuthor ? (
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Автор тура
                  </span>
                ) : null}
              </div>
              {guide.bio.trim() ? (
                <p className="mt-2 text-sm leading-relaxed text-slate">{guide.bio}</p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
