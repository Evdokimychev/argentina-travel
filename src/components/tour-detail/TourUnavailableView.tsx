import Link from "next/link";
import { Public503Analytics } from "@/components/analytics/PublicStatusAnalytics";

type Props = {
  slug: string;
  errorClass?: string;
};

export default function TourUnavailableView({ slug, errorClass }: Props) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-2xl flex-col justify-center px-4 py-16">
      <Public503Analytics slug={slug} errorClass={errorClass} />
      <p className="text-sm font-medium uppercase tracking-wide text-slate">
        Временно недоступно
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-charcoal">
        Страница тура сейчас недоступна
      </h1>
      <p className="mt-4 text-base leading-relaxed text-slate">
        Источник данных временно не отвечает. Это не значит, что тур удалён — обновите
        страницу чуть позже или вернитесь в каталог.
      </p>
      <p className="mt-2 text-sm text-slate/80">Ссылка: /tours/{slug}</p>
      {errorClass ? (
        <p className="mt-1 text-xs text-slate/60" data-error-class={errorClass}>
          Код состояния: {errorClass}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/tours"
          className="inline-flex rounded-xl bg-charcoal px-4 py-2.5 text-sm font-medium text-white"
        >
          Открыть каталог туров
        </Link>
        <Link
          href="/"
          className="inline-flex rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-medium text-charcoal"
        >
          На главную
        </Link>
      </div>
      <meta httpEquiv="Refresh" content="60" />
    </main>
  );
}
