import Link from "next/link";
import { ArrowUpRight, Compass, Shield, Users } from "lucide-react";
import PlatformStatsBlock from "@/components/marketplace/PlatformStatsBlock";
import DesignSystemShowcase from "@/components/about/DesignSystemShowcase";
import { Button, buttonVariants } from "@/components/ui/button";
import { siteContainerClass } from "@/lib/site-container";
import type { PlatformStats } from "@/lib/organizer-public";
import { cn } from "@/lib/cn";

interface AboutPageViewProps {
  platformStats: PlatformStats;
}

const VALUES = [
  {
    icon: Compass,
    title: "Для путешественников",
    description:
      "Каталог авторских маршрутов с прозрачными условиями, реальными отзывами и заявкой без предоплаты до подтверждения организатором.",
  },
  {
    icon: Users,
    title: "Для организаторов",
    description:
      "Инструменты для публикации туров, управления заявками и общения с туристами — без лишней бюрократии на старте.",
  },
  {
    icon: Shield,
    title: "Доверие и честность",
    description:
      "Мы не придумываем статистику: рейтинги и отзывы появляются после реальных поездок. Новые туры помечаются как «Новый».",
  },
] as const;

export default function AboutPageView({ platformStats }: AboutPageViewProps) {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sky/10 via-white to-surface-muted pb-16 pt-12 sm:pb-20 sm:pt-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sun/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-sky/25 blur-3xl" />
        <div className={cn(siteContainerClass, "relative")}>
          <p className="text-sm font-semibold uppercase tracking-wider text-sky">
            Пора в Аргентину
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-tight text-charcoal sm:text-4xl lg:text-5xl">
            Маркетплейс авторских туров с&nbsp;аргентинским характером
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate">
            Мы соединяем путешественников и проверенных организаторов — от ледников Патагонии до
            танго Буэнос-Айреса. Светлый интерфейс, понятное бронирование, честная обратная связь.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/tours" className={buttonVariants({ size: "lg" })}>
              Смотреть туры
            </Link>
            <Link
              href="#design-system"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Design System
            </Link>
          </div>
        </div>
      </section>

      <PlatformStatsBlock initialStats={platformStats} />

      {/* Platform story */}
      <section className="py-16 sm:py-20">
        <div className={siteContainerClass}>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <h2 className="font-heading text-2xl font-bold text-charcoal sm:text-3xl">
                Кто мы и зачем это делаем
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate">
                Argentina Travel — русскоязычная площадка для бронирования авторских туров по
                Аргентине. Мы не туроператор: каждый маршрут ведёт независимый организатор со
                своей программой, ценами и условиями.
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate">
                Наша задача — сделать выбор тура простым и безопасным: понятные карточки, фильтры
                по регионам и активностям, личный кабинет для заявок и сообщений. Платформа молодая
                — мы растём вместе с первыми организаторами и путешественниками.
              </p>
              <Link
                href="/join"
                className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-sky hover:underline"
              >
                Стать организатором
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-1">
              {VALUES.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky/10 text-sky">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-bold text-charcoal">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <DesignSystemShowcase />

      {/* CTA */}
      <section className="border-t border-gray-100 bg-surface-muted py-16">
        <div className={cn(siteContainerClass, "text-center")}>
          <h2 className="font-heading text-2xl font-bold text-charcoal sm:text-3xl">
            Готовы открыть Аргентину?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-slate">
            Выберите маршрут в каталоге или напишите нам — поможем с выбором
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/tours">
              <Button size="lg">Каталог туров</Button>
            </Link>
            <Link href="/contacts">
              <Button size="lg" variant="outline">
                Связаться с нами
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
