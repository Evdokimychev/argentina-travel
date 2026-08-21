import type { Metadata } from "next";
import Link from "next/link";
import { PUBLIC_ORGANIZERS } from "@/data/public-organizers";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { buildPublicOrganizerProfile } from "@/lib/organizer-public";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { siteContainerClass } from "@/lib/site-container";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Организаторы туров по Аргентине",
  description:
    "Проверенные авторы маршрутов: профили организаторов, с которыми можно связаться на «Пора в Аргентину».",
  path: "/organizers",
});

export default function OrganizersIndexPage() {
  const profiles = PUBLIC_ORGANIZERS.map((organizer) =>
    buildPublicOrganizerProfile(organizer.id),
  ).filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));

  return (
    <main className="bg-surface pb-16 pt-10 sm:pb-20 sm:pt-14">
      <div className={siteContainerClass}>
        <header className="max-w-2xl">
          <p className="text-sm font-medium text-sky-ink">Авторы маршрутов</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-charcoal sm:text-4xl">
            Организаторы
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate">
            Здесь — публичные профили авторов туров. Чтобы предложить свой маршрут, подайте заявку
            через страницу для организаторов.
          </p>
        </header>

        {profiles.length > 0 ? (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <li key={profile.slug}>
                <Link
                  href={`/organizers/${profile.slug}`}
                  className="block rounded-2xl border border-border-subtle bg-surface-elevated p-5 transition-colors hover:border-sky/40 hover:bg-sky/5"
                >
                  <h2 className="font-heading text-lg font-semibold text-charcoal">{profile.name}</h2>
                  {profile.shortDescription ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate">
                      {profile.shortDescription}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-slate">Авторские туры по Аргентине</p>
                  )}
                  <span className="mt-4 inline-block text-sm font-medium text-sky-ink">
                    Открыть профиль →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-border-default bg-surface-muted px-6 py-12 text-center">
            <p className="font-medium text-charcoal">Публичные профили скоро появятся</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate">
              Пока можно посмотреть каталог туров или подать заявку, если вы организатор.
            </p>
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/join" className={cn(buttonVariants())}>
            Стать организатором
          </Link>
          <Link href="/tours" className={cn(buttonVariants({ variant: "outline" }))}>
            Каталог туров
          </Link>
        </div>
      </div>
    </main>
  );
}
