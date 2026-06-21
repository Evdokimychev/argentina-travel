import Link from "next/link";
import { fetchSiteContact } from "@/lib/site-settings-server";

export const metadata = {
  title: "Техническое обслуживание",
  robots: { index: false, follow: false },
};

export default async function MaintenancePage() {
  const contact = await fetchSiteContact();
  const supportEmail = contact.supportEmail?.trim() || "hello@goargentina.ru";

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-sky">Сайт на обслуживании</p>
      <h1 className="mt-4 max-w-lg font-heading text-3xl font-bold text-charcoal sm:text-4xl">
        Скоро вернёмся
      </h1>
      <p className="mt-4 max-w-md text-slate">
        Мы обновляем сервис. Попробуйте зайти позже или напишите на{" "}
        <a href={`mailto:${supportEmail}`} className="text-sky hover:underline">
          {supportEmail}
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
