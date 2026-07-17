import { Building2, BusFront, CarFront, House, Route, Sparkles } from "lucide-react";
import { DEFAULT_SITE_MODULES } from "@/lib/cms/site-globals/normalize";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { SiteModulesGlobal } from "@/types/site-globals";

function asModules(values: Record<string, unknown>): SiteModulesGlobal {
  return { ...DEFAULT_SITE_MODULES, ...values } as SiteModulesGlobal;
}

const MODE_LABELS = {
  disabled: "Отключено",
  request: "Заявка менеджеру",
  partner: "Партнёрский сервис",
  preparing_native: "Готовим свой каталог",
  native_request: "Свой каталог — запрос подтверждения",
  preparing_hybrid: "Партнёр + готовим свой каталог",
  planned: "В планах",
} as const;

function statusClass(mode: string): string {
  if (mode === "partner" || mode === "request" || mode === "native_request") return "bg-emerald-50 text-emerald-700";
  if (mode.startsWith("preparing") || mode === "planned") return "bg-amber-50 text-amber-800";
  return "bg-surface-muted text-slate";
}

export default function TravelModulesPreview({ values }: { values: Record<string, unknown> }) {
  const modules = asModules(values);
  const cards = [
    {
      id: "tours",
      title: "Туры",
      mode: "Собственные + партнёрские",
      icon: Route,
      tourist: "Каталог, карточка, расписание и честный сценарий бронирования.",
      organizer: "Создание, редактирование, доступность и модерация уже существуют.",
      publicVisible: true,
    },
    {
      id: "excursions",
      title: "Экскурсии",
      mode: "Платформа + партнёры",
      icon: Sparkles,
      tourist: "Tripster/Sputnik8 и собственные предложения разделены по способу оформления.",
      organizer: "Расширение собственного кабинета выполняется только поверх capability contract.",
      publicVisible: true,
    },
    {
      id: "apartments",
      title: "Апартаменты",
      mode: MODE_LABELS[modules.apartmentsMode],
      rawMode: modules.apartmentsMode,
      icon: House,
      tourist: modules.apartmentsMode === "native_request" ? "Каталог, карточка и запрос дат с явным ожиданием подтверждения." : "Понятная заявка на подбор без выдуманной доступности и оплаты.",
      organizer: modules.apartmentsMode === "native_request" ? "Объект, права на фото, календарь, тариф, модерация и публикация работают." : "Собственный инвентарь не публикуется в этом режиме.",
      publicVisible: modules.showApartmentsInServices && modules.apartmentsMode !== "disabled",
    },
    {
      id: "cars",
      title: "Автомобили",
      mode: MODE_LABELS[modules.carRentalMode],
      rawMode: modules.carRentalMode,
      icon: CarFront,
      tourist: "Рабочий партнёрский поиск LocalRent остаётся отдельным честным каналом.",
      organizer: "Собственные авто потребуют парк, документы, залог, доступность и выдачу.",
      publicVisible: modules.showCarRentalInServices && modules.carRentalMode !== "disabled",
    },
    {
      id: "transfers",
      title: "Трансферы",
      mode: MODE_LABELS[modules.transfersMode],
      rawMode: modules.transfersMode,
      icon: BusFront,
      tourist:
        modules.transfersMode === "request"
          ? "Публичная карточка ведёт в ручную заявку с уточнением маршрута и условий."
          : modules.transfersMode === "disabled"
            ? "Модуль не продвигается на странице сервисов."
            : "Intui выполняет партнёрский поиск; ручная заявка остаётся безопасным fallback.",
      organizer: "Для своих услуг нужны перевозчик, машина, маршрут, вместимость и расписание.",
      publicVisible: modules.showTransfersInServices && modules.transfersMode !== "disabled",
    },
    {
      id: "hotels",
      title: "Отели",
      mode: MODE_LABELS[modules.hotelsMode],
      rawMode: modules.hotelsMode,
      icon: Building2,
      tourist: "Не публикуются как собственный продукт, пока нет контракта и источника доступности.",
      organizer: "Только roadmap: разработка отельного модуля сейчас не начинается.",
      publicVisible: false,
    },
  ];

  return (
    <section className={`${cabinetCardClass} space-y-5 p-5`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-ink">Экосистема поездки</p>
        <h2 className="mt-1 font-heading text-lg font-bold text-foreground">Как работают продуктовые модули</h2>
        <p className="mt-1 max-w-4xl text-sm leading-6 text-slate">
          Настройка управляет точкой входа и продвижением модуля. Она не создаёт таблицы, права
          организатора, доступность или оплату автоматически — эти возможности включаются только
          после отдельной серверной реализации и проверки.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.id} className="rounded-3xl border border-border-subtle bg-surface-muted/45 p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sky-ink shadow-sm dark:bg-surface-elevated">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(card.rawMode ?? "partner")}`}>
                  {card.mode}
                </span>
              </div>
              <h3 className="mt-4 font-heading text-base font-bold text-foreground">{card.title}</h3>
              <dl className="mt-3 space-y-2 text-xs leading-5 text-slate">
                <div>
                  <dt className="font-semibold text-foreground">Для путешественника</dt>
                  <dd>{card.tourist}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">Для организатора</dt>
                  <dd>{card.organizer}</dd>
                </div>
              </dl>
              <p className={`mt-3 text-xs font-semibold ${card.publicVisible ? "text-emerald-700" : "text-slate"}`}>
                {card.publicVisible ? "Есть публичная точка входа" : "Не продвигается публично"}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
