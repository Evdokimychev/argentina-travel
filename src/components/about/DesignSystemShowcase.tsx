"use client";

import { useState } from "react";
import { siteScrollAnchorClass } from "@/lib/site-container";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Check, MessageSquare } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { SwitchField, SwitchRow } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { StarRating } from "@/components/ui/star-rating";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import BookingPaymentStatusBadge from "@/components/booking/BookingPaymentStatusBadge";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";
import { tourCardShellClass, tourCardShellInteractiveClass } from "@/lib/tour-card-shell";
import {
  SHADOW_CARD,
  SHADOW_ELEVATED,
  SHADOW_MODAL,
  CARD_HOVER,
} from "@/styles/design-tokens";

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
  const [switchOn, setSwitchOn] = useState(true);

  return (
    <section id="design-system" className={`${siteScrollAnchorClass} border-t border-gray-100 bg-white py-16 sm:py-20`}>
      <div className={siteContainerClass}>
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-sky">Design System</p>
          <h2 className="mt-2 font-heading text-3xl font-bold text-charcoal sm:text-4xl">
            Визуальный язык платформы
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate">
            Argentina Travel — светлый премиальный маркетплейс с аргентинской идентичностью:
            небесно-голубой primary, тёплые нейтрали и сдержанные семантические акценты.
          </p>
        </div>

        {/* Colors */}
        <div className="mt-14">
          <h3 className="font-heading text-xl font-bold text-charcoal">Цвета</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {COLOR_SWATCHES.map((swatch) => (
              <Swatch key={swatch.name} {...swatch} />
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="mt-16">
          <h3 className="font-heading text-xl font-bold text-charcoal">Типографика</h3>
          <div className="mt-6 space-y-6 rounded-2xl border border-gray-100 bg-surface-muted/50 p-6 sm:p-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate">Display · Unbounded (h1 страниц и тура)</p>
              <p className="mt-1 font-display text-4xl font-bold leading-tight text-charcoal sm:text-5xl">
                Путешествия по Аргентине
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate">Карточка тура · system-ui</p>
              <p className="mt-1 font-heading text-lg font-bold text-charcoal">Треккинг в Национальном парке Лос-Гласьярес</p>
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
          <h3 className="font-heading text-xl font-bold text-charcoal">Кнопки</h3>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Удалить</Button>
            <Button variant="link">Ссылка-кнопка</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>

        {/* Dialog */}
        <div className="mt-16">
          <h3 className="font-heading text-xl font-bold text-charcoal">Диалог</h3>
          <p className="mt-2 text-sm text-slate">
            Единый оверлей, bottom sheet на мобильных, панель rounded-2xl на десктопе.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="mt-4">
                Открыть демо-диалог
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-0">
              <DialogHeader>
                <DialogTitle>Пример модального окна</DialogTitle>
                <DialogDescription>
                  Используется для авторизации, бронирования, подсказок и форм организатора.
                </DialogDescription>
              </DialogHeader>
              <div className="px-5 pb-5 sm:px-6">
                <p className="text-sm text-slate">
                  Нажмите вне панели или Esc, чтобы закрыть. z-50, backdrop charcoal/50 + blur.
                </p>
                <Button className="mt-4 w-full">Понятно</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Cards */}
        <div className="mt-16">
          <h3 className="font-heading text-xl font-bold text-charcoal">Карточки</h3>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <article className={cn(tourCardShellClass, tourCardShellInteractiveClass)}>
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

            <StatCard value={12} label="Туров в каталоге" />

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Заявка #AT-1042</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate">Патагония · 12–20 марта</p>
                <BookingPaymentStatusBadge status="pending" />
              </CardContent>
              <CardFooter className="pt-0">
                <Link href="/tours" className={cn(buttonVariants({ size: "sm" }), "w-full")}>
                  Подробнее
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Form fields */}
        <div className="mt-16">
          <h3 className="font-heading text-xl font-bold text-charcoal">Поля форм</h3>
          <div className="mt-6 max-w-md space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
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
              <Textarea
                id="ds-message"
                rows={3}
                placeholder="Расскажите о планах..."
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="ds-region" className="text-sm font-medium text-charcoal">
                Регион
              </label>
              <NativeSelect id="ds-region" className="mt-1" defaultValue="patagonia">
                <option value="patagonia">Патагония</option>
                <option value="buenos-aires">Буэнос-Айрес</option>
                <option value="mendoza">Мендоса</option>
              </NativeSelect>
            </div>
            <SwitchField
              checked={switchOn}
              onCheckedChange={setSwitchOn}
              label="Уведомления о бронировании"
              description="Получать email при новых заявках"
            />
            <SwitchRow
              checked={switchOn}
              onCheckedChange={setSwitchOn}
              label="Строка с переключателем"
              labelAddon={<Badge variant="new">Новый</Badge>}
            />
            <label className="flex cursor-pointer items-center gap-3 text-sm text-charcoal">
              <Checkbox defaultChecked id="ds-check" />
              Согласен с условиями бронирования
            </label>
          </div>
        </div>

        {/* Table */}
        <div className="mt-16">
          <h3 className="font-heading text-xl font-bold text-charcoal">Таблица</h3>
          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100">
            <Table>
              <TableHeader className="bg-pampas/60">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Тур</TableHead>
                  <TableHead>Турист</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-charcoal">Патагония Premium</TableCell>
                  <TableCell>Анна К.</TableCell>
                  <TableCell>
                    <BookingPaymentStatusBadge status="paid" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-charcoal">Танго в Буэнос-Айресе</TableCell>
                  <TableCell>Игорь М.</TableCell>
                  <TableCell>
                    <BookingPaymentStatusBadge status="pending" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-16">
          <h3 className="font-heading text-xl font-bold text-charcoal">Бейджи и статусы</h3>
          <div className="mt-6 flex flex-wrap gap-2">
            <Badge variant="new">Новый</Badge>
            <Badge variant="hot">Горящий</Badge>
            <Badge variant="hit">Хит</Badge>
            <Badge variant="family">Семейный</Badge>
            <Badge variant="expedition">Экспедиция</Badge>
            <Badge variant="outline">Outline</Badge>
            <StarRating layout="badge" isNew newLabel="Новый тур" size="xs" />
            <span className="inline-flex items-center gap-1 rounded-full bg-success-muted px-2.5 py-1 text-xs font-semibold text-success">
              <Check className="h-3 w-3" /> Проверенная поездка
            </span>
            <BookingPaymentStatusBadge status="paid" />
            <BookingPaymentStatusBadge status="partial" />
            <BookingPaymentStatusBadge status="refunded" />
          </div>
        </div>

        {/* Shadows & motion */}
        <div className="mt-16">
          <h3 className="font-heading text-xl font-bold text-charcoal">Тени и motion</h3>
          <p className="mt-2 text-sm text-slate">
            Три уровня elevation: карточки каталога → панель бронирования → модалки. Hover карточек —
            только тень, без translateY. При <code className="text-xs">prefers-reduced-motion</code>{" "}
            анимации и transform отключаются.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className={cn("rounded-2xl border border-gray-100 bg-white p-6", SHADOW_CARD)}>
              <p className="font-semibold text-charcoal">shadow-card</p>
              <p className="mt-1 text-xs text-slate">Каталог, list tiles</p>
            </div>
            <div className={cn("rounded-2xl border border-gray-100 bg-white p-6", SHADOW_ELEVATED)}>
              <p className="font-semibold text-charcoal">shadow-elevated</p>
              <p className="mt-1 text-xs text-slate">Панель бронирования, sticky</p>
            </div>
            <div className={cn("rounded-2xl border border-gray-100 bg-white p-6", SHADOW_MODAL)}>
              <p className="font-semibold text-charcoal">shadow-modal</p>
              <p className="mt-1 text-xs text-slate">Dialog, popover</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate">
            Hover-класс карточек: <code className="font-mono">{CARD_HOVER}</code>
          </p>
        </div>

        {/* Star rating */}
        <div className="mt-16">
          <h3 className="font-heading text-xl font-bold text-charcoal">Рейтинг</h3>
          <div className="mt-6 flex flex-wrap items-center gap-6 rounded-2xl border border-gray-100 bg-surface-muted/50 p-6">
            <StarRating layout="badge" score="4.8" count={24} size="sm" />
            <StarRating layout="badge" isNew newLabel="Новый" size="sm" />
            <StarRating stars={5} size="md" />
            <StarRating stars={4} size="lg" />
          </div>
        </div>

        {/* Spacing */}
        <div className="mt-16">
          <h3 className="font-heading text-xl font-bold text-charcoal">Шкала отступов</h3>
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
          <h3 className="font-heading text-xl font-bold text-charcoal">Пустые состояния</h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <EmptyState
              icon={MessageSquare}
              title="Отзывов пока нет"
              description="Мы показываем только реальные отзывы после поездок."
            />
            <EmptyState
              icon={MapPin}
              title="Туры не найдены"
              description="Попробуйте изменить фильтры или сбросить их."
              action={{ label: "Сбросить фильтры", href: "/tours", variant: "outline" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
