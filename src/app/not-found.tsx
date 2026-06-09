import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl font-bold text-sky">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-charcoal">
        Страница не найдена
      </h1>
      <p className="mt-2 text-slate">
        Возможно, страница была удалена или адрес введён неверно.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-patagonia px-8 py-3 font-semibold text-white hover:bg-patagonia-light"
      >
        На главную
      </Link>
    </div>
  );
}
