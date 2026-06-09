interface OrganizerPlaceholderSectionProps {
  title: string;
  description: string;
}

export default function OrganizerPlaceholderSection({
  title,
  description,
}: OrganizerPlaceholderSectionProps) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
      <h1 className="font-display text-2xl font-bold text-charcoal">{title}</h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate">{description}</p>
      <p className="mt-4 text-xs text-slate">Раздел в разработке</p>
    </div>
  );
}
