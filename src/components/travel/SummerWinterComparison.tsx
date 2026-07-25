import { SUMMER_WINTER_ROWS, SUMMER_WINTER_UI } from "@/data/patagonia-packing-list";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  labels?: typeof SUMMER_WINTER_UI;
};

/**
 * Сравнение сборов летом и зимой. На десктопе — таблица, на мобиле — карточки
 * (без горизонтальной прокрутки), по образцу BlogComparisonTableBlock.
 */
export default function SummerWinterComparison({
  className,
  labels = SUMMER_WINTER_UI,
}: Props) {
  return (
    <section className={cn("space-y-3", className)} aria-label={labels.ariaLabel}>
      <div>
        <h3 className="font-heading text-base font-semibold text-charcoal">{labels.title}</h3>
        <p className="mt-1 text-sm text-slate">{labels.hint}</p>
      </div>

      {/* Мобильные карточки */}
      <ul className="space-y-2.5 sm:hidden" role="list" aria-label={labels.title}>
        {SUMMER_WINTER_ROWS.map((row) => (
          <li
            key={row.aspect}
            className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm"
          >
            <p className="text-sm font-semibold leading-snug text-charcoal">{row.aspect}</p>
            <dl className="mt-2 space-y-1.5">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate">
                  {labels.summerHeader}
                </dt>
                <dd className="text-sm leading-relaxed text-slate">{row.summer}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate">
                  {labels.winterHeader}
                </dt>
                <dd className="text-sm leading-relaxed text-slate">{row.winter}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      {/* Десктопная таблица */}
      <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-surface-muted/60">
              <th scope="col" className="px-4 py-3 font-heading text-sm font-bold text-charcoal">
                {labels.aspectHeader}
              </th>
              <th scope="col" className="px-4 py-3 font-heading text-sm font-bold text-charcoal">
                {labels.summerHeader}
              </th>
              <th scope="col" className="px-4 py-3 font-heading text-sm font-bold text-charcoal">
                {labels.winterHeader}
              </th>
            </tr>
          </thead>
          <tbody>
            {SUMMER_WINTER_ROWS.map((row) => (
              <tr key={row.aspect} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3 font-medium text-charcoal">{row.aspect}</td>
                <td className="px-4 py-3 text-slate">{row.summer}</td>
                <td className="px-4 py-3 text-slate">{row.winter}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
