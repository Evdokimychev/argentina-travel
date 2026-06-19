"use client";

interface TourAccommodationSettingsBlockProps {
  upgradesEnabled: boolean;
  onChange: (upgradesEnabled: boolean) => void;
}

export default function TourAccommodationSettingsBlock({
  upgradesEnabled,
  onChange,
}: TourAccommodationSettingsBlockProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      <div>
        <h3 className="font-heading text-base font-bold text-charcoal">Настройки проживания</h3>
        <p className="mt-1 text-sm text-slate">
          Управляйте тем, как турист видит жильё на странице тура и при бронировании
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-brand-light/20 p-4">
        <input
          type="checkbox"
          checked={upgradesEnabled}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-brand"
        />
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-charcoal">
            Разрешить выбор типа номера при бронировании
          </span>
          <span className="mt-1 block text-sm text-slate">
            Типы номеров из мест проживания появятся на шаге «Проживание» в форме заявки. Если
            выключено — турист видит только описание жилья без выбора.
          </span>
        </span>
      </label>
    </section>
  );
}
