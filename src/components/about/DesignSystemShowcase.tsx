import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Check } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import BookingPaymentStatusBadge from "@/components/booking/BookingPaymentStatusBadge";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";

const COLOR_SWATCHES = [
  { name: "Primary (Sky)", className: "bg-sky", hex: "#74ACDF", note: "CTA, ссылки, фокус" },
  { name: "Primary Dark", className: "bg-sky-dark", hex: "#5A8FC4", note: "Hover состояния" },
  { name: "Charcoal", className: "bg-charcoal", hex: "#1A1A2E", note: "Заголовки, текст" },
  { name: "Slate", className: "bg-slate", hex: "#4A5568", note: "Вторичный текст" },
  { name: "Surface Muted", className: "bg-surface-muted ring-1 ring-gray-200", hex: "#F7F8FA", note: "Фон страниц" },
  { name: "Success", className: "bg-success", hex: "#2F6F4E", note: "Подтверждения" },
  { name: "Warning", className: "bg-warning", hex: "#9A6700", note: "Предупреждения" },
  { name: "Error", className: "bg-error", hex: "#B42318", note: "Ошибки" },
  { name: "Accent Earth", className: "bg-brand", hex: "#D4533B", note: "Промо, акценты" },
  { name: "Sun", className: "bg-sun", hex: "#FCBF49", note: "Рейтинг, звёзды" },
] as const;

const SPACING_STEPS = [4, 8, 12, 16, 24, 32, 48, 64] as const;

function Swatch({ name, className, hex, note }: (typeof COLOR_SWATCHES)[number]) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className={cn("h-16", className)} />
      <div className="p-3">
        <p className="text-sm font-semibold text-charcoal">{name}</p>
        <p className="mt-0.5 font-mono text-xs text-slate">{hex}</p>
        <p className="mt-1 text-xs text-slate">{note}</p>
      </div>
    </div>
  );
}

export default function DesignSystemShowcase() {
  return (
    <section id="design-system" className="scroll-mt-24 border-t border-gray-100 bg-white py-16 sm:py-20">
      <div className={siteContainerClass}>
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-sky">Design System</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-charcoal sm:text-4xl">
            Визуальный язык платформы
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate">
            Argentina Travel — светлый премиальный маркетплейс с аргентинской идентичностью:
            небесно-голубой primary, тёплые нейтрали и сдержанные семантические акценты.
          </p>
        </div>

        {/* Colors */}
        <div className="mt-14">
          <h3 className="font-display text-xl font-bold text-charcoal">Цвета</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {COLOR_SWATCHES.map((swatch) => (
              <Swatch key={swatch.name} {...swatch} />
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="mt-16">
          <h3 className="font-display text-xl font-bold text-charcoal">Типографика</h3>
          <div className="mt-6 space-y-6 rounded-2xl border border-gray-100 bg-surface-muted/50 p-6 sm:p-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate">Display XL · Unbounded</p>
              <p className="mt-1 font-display text-4xl font-bold leading-tight text-charcoal sm:text-5xl">
                Путешествия по Аргентине
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate">Display LG</p>
              <p className="mt-1 font-display text-3xl font-bold text-charcoal">Авторские туры</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate">Heading MD</p>
              <p className="mt-1 font-display text-xl font-bold text-charcoal">Патагония и Буэнос-Айрес</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate">Body</p>
              <p className="mt-1 text-base leading-relaxed text-charcoal">
                Основной текст — system-ui, 16px, комфортная высота строки для описаний туров и
                форм бронирования.
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate">Caption</p>
              <p className="mt-1 text-xs text-slate">Мета-информация · даты · регион · 12px</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-16">
          <h3 className="font-display text-xl font-bold text-charcoal">Кнопки</h3>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>

        {/* Cards */}
        <div className="mt-16">
          <h3 className="font-display text-xl font-bold text-charcoal">Карточки</h3>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="relative aspect-[4/3] bg-gray-100">
                <Image
                  src="https://images.unsplash.com/photo-1551524164-6cf2ac7bd851?w=400&q=80"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="320px"
                />
                <Badge variant="new" className="absolute left-3 top-3">
                  Новинка
                </Badge>
              </div>
              <div className="p-4">
                <p className="flex items-center gap-1 text-xs text-slate">
                  <MapPin className="h-3 w-3" /> Патагония
                </p>
                <h4 className="mt-1 font-semibold text-charcoal">Ледники и фьорды</h4>
                <p className="mt-2 text-sm font-bold text-charcoal">от $1 890</p>
              </div>
            </article>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
              <p className="font-display text-3xl font-bold text-charcoal">12</p>
              <p className="mt-1 text-sm text-slate">Туров в каталоге</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-charcoal">Заявка #AT-1042</p>
                <BookingPaymentStatusBadge status="pending" />
              </div>
              <p className="mt-2 text-sm text-slate">Патагония · 12–20 марта</p>
              <Link href="/tours" className={cn(buttonVariants({ size: "sm" }), "mt-4 w-full")}>
                Подробнее
              </Link>
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div className="mt-16">
          <h3 className="font-display text-xl font-bold text-charcoal">Поля форм</h3>
          <div className="mt-6 max-w-md space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div>
              <label htmlFor="ds-name" className="text-sm font-medium text-charcoal">
                Имя
              </label>
              <Input id="ds-name" placeholder="Ваше имя" className="mt-1" />
            </div>
            <div>
              <label htmlFor="ds-message" className="text-sm font-medium text-charcoal">
                Сообщение
              </label>
              <textarea
                id="ds-message"
                rows={3}
                placeholder="Расскажите о планах..."
                className="mt-1 flex w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-gray-400 focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/20"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-charcoal">
              <Checkbox defaultChecked id="ds-check" />
              Согласен с условиями бронирования
            </label>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-16">
          <h3 className="font-display text-xl font-bold text-charcoal">Бейджи и статусы</h3>
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge variant="new">Новый</Badge>
            <Badge variant="hot">Горящий</Badge>
            <Badge variant="hit">Хит</Badge>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky/10 px-2.5 py-1 text-xs font-semibold text-sky">
              <Star className="h-3 w-3 fill-current" /> Новый тур
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-success-muted px-2.5 py-1 text-xs font-semibold text-success">
              <Check className="h-3 w-3" /> Проверенная поездка
            </span>
            <BookingPaymentStatusBadge status="paid" />
            <BookingPaymentStatusBadge status="partial" />
            <BookingPaymentStatusBadge status="refunded" />
          </div>
        </div>

        {/* Spacing */}
        <div className="mt-16">
          <h3 className="font-display text-xl font-bold text-charcoal">Шкала отступов</h3>
          <div className="mt-6 flex flex-wrap items-end gap-4">
            {SPACING_STEPS.map((px) => (
              <div key={px} className="text-center">
                <div
                  className="rounded-lg bg-sky/20"
                  style={{ width: px, height: px }}
                />
                <p className="mt-2 font-mono text-xs text-slate">{px}px</p>
              </div>
            ))}
          </div>
        </div>

        {/* Empty states */}
        <div className="mt-16">
          <h3 className="font-display text-xl font-bold text-charcoal">Пустые состояния</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-dashed border-gray-200 bg-surface-muted/50 px-6 py-10 text-center">
              <Star className="mx-auto h-8 w-8 text-sky/60" />
              <p className="mt-3 font-medium text-charcoal">Новый тур</p>
              <p className="mt-1 text-sm text-slate">Отзывов пока нет — будьте первым</p>
            </div>
            <div className="rounded-2xl border border-dashed border-gray-200 bg-surface-muted/50 px-6 py-10 text-center">
              <p className="font-medium text-charcoal">Отзывов пока нет</p>
              <p className="mt-1 text-sm text-slate">
                Мы показываем только реальные отзывы после поездок
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
