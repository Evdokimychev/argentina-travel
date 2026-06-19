import Link from "next/link";

export const metadata = {
  title: "Техническое обслуживание — Пора в Аргентину",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-sky">Сайт на обслуживании</p>
      <h1 className="mt-4 max-w-lg font-heading text-3xl font-bold text-charcoal sm:text-4xl">
        Скоро вернёмся
      </h1>
      <p className="mt-4 max-w-md text-slate">
        Мы обновляем сервис. Попробуйте зайти позже или напишите на{" "}
        <a href="mailto:hello@goargentina.ru" className="text-sky hover:underline">
          hello@goargentina.ru
        </a>
        .
      </p>
      <Link
        href="/admin"
        className="mt-8 text-sm text-slate underline-offset-2 hover:text-charcoal hover:underline"
      >
        Вход для администраторов
      </Link>
    </main>
  );
}
