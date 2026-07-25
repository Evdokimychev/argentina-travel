"use client";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import DensitySelect from "@/components/admin/page-builder/fields/DensitySelect";
import LinkItemsEditor from "@/components/admin/page-builder/fields/LinkItemsEditor";
import { CALLOUT_VARIANTS } from "@/lib/cms/page-builder/block-registry";
import type {
  BlogArticleSummaryVariant,
  BlogBodyBlock,
  BlogGalleryVariant,
  BlogPhotoVariant,
  BlogSourceGroup,
} from "@/types/blog-content-blocks";

const PHOTO_VARIANT_OPTIONS: Array<{ value: BlogPhotoVariant; label: string }> = [
  { value: "content-width", label: "По ширине текста" },
  { value: "full-width", label: "На всю ширину" },
  { value: "wide", label: "Широкая" },
  { value: "portrait", label: "Портрет" },
  { value: "landscape", label: "Альбом" },
  { value: "float-left", label: "Обтекание слева" },
  { value: "float-right", label: "Обтекание справа" },
  { value: "framed", label: "В рамке" },
  { value: "edge-to-edge", label: "Край в край" },
  { value: "editorial-split", label: "Редакционный сплит" },
  { value: "with-quote", label: "С цитатой" },
  { value: "with-facts", label: "С фактами" },
];

const SUMMARY_VARIANT_OPTIONS: Array<{ value: BlogArticleSummaryVariant; label: string }> = [
  { value: "cards", label: "Карточки" },
  { value: "horizontal-deck", label: "Горизонтальная лента" },
  { value: "checklist", label: "Чек-лист" },
  { value: "key-facts", label: "Ключевые факты" },
  { value: "quick-answer", label: "Быстрый ответ" },
  { value: "step-by-step", label: "По шагам" },
  { value: "timeline-summary", label: "Хронология" },
];

const GALLERY_VARIANT_OPTIONS: Array<{ value: BlogGalleryVariant; label: string }> = [
  { value: "grid", label: "Сетка" },
  { value: "filmstrip", label: "Лента" },
  { value: "carousel", label: "Карусель (горизонтальный скролл)" },
  { value: "comparison", label: "Сравнение" },
  { value: "location", label: "Локация" },
];

const SOURCE_TYPE_OPTIONS: Array<{ value: BlogSourceGroup; label: string }> = [
  { value: "official", label: "Официальный" },
  { value: "legal", label: "Правовой" },
  { value: "primary-data", label: "Первичные данные" },
  { value: "ru-context", label: "RU-контекст" },
  { value: "personal", label: "Личный опыт" },
  { value: "updates", label: "Обновления" },
];

type Props = {
  block: BlogBodyBlock;
  onChange: (block: BlogBodyBlock) => void;
  onPickMedia?: () => void;
};

function linesToList(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function listToLines(items: string[]): string {
  return items.join("\n");
}

export default function PageBuilderBlockFields({ block, onChange, onPickMedia }: Props) {
  switch (block.type) {
    case "paragraph":
    case "subheading":
      return (
        <textarea
          className="min-h-[80px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder="Текст…"
        />
      );

    case "bullets":
    case "steps":
      return (
        <label className="block space-y-1 text-xs text-slate">
          Пункты (по одному на строку)
          <textarea
            className="min-h-[100px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal"
            value={listToLines(block.items)}
            onChange={(e) => onChange({ ...block, items: linesToList(e.target.value) })}
          />
        </label>
      );

    case "divider":
      return <p className="text-xs text-slate">Визуальный разделитель без полей.</p>;

    case "callout":
      return (
        <div className="space-y-2">
          <NativeSelect
            value={block.variant}
            onChange={(e) =>
              onChange({ ...block, variant: e.target.value as typeof block.variant })
            }
          >
            {CALLOUT_VARIANTS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </NativeSelect>
          <Input
            value={block.title}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
            placeholder="Заголовок"
          />
          <textarea
            className="min-h-[72px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={block.body}
            onChange={(e) => onChange({ ...block, body: e.target.value })}
            placeholder="Текст выноски"
          />
        </div>
      );

    case "checklist":
      return (
        <div className="space-y-2">
          {block.items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={item.text}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...items[index], text: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="Пункт"
              />
              <label className="flex shrink-0 items-center gap-1 text-xs text-slate">
                <input
                  type="checkbox"
                  checked={item.negative ?? false}
                  onChange={(e) => {
                    const items = [...block.items];
                    items[index] = { ...items[index], negative: e.target.checked };
                    onChange({ ...block, items });
                  }}
                />
                ✗
              </label>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChange({ ...block, items: [...block.items, { text: "" }] })}
          >
            + Пункт
          </Button>
        </div>
      );

    case "faq":
      return (
        <div className="space-y-3">
          {block.items.map((item, index) => (
            <div key={index} className="space-y-1 rounded-xl border border-gray-100 p-2">
              <Input
                value={item.question}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...items[index], question: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="Вопрос"
              />
              <textarea
                className="min-h-[60px] w-full rounded-lg border border-gray-200 px-2 py-1 text-sm"
                value={item.answer}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...items[index], answer: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="Ответ"
              />
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({ ...block, items: [...block.items, { question: "", answer: "" }] })
            }
          >
            + Вопрос
          </Button>
        </div>
      );

    case "table":
      return (
        <div className="space-y-2 text-xs">
          <Input
            value={block.headers.join(" | ")}
            onChange={(e) =>
              onChange({
                ...block,
                headers: e.target.value.split("|").map((h) => h.trim()),
              })
            }
            placeholder="Заголовки через |"
          />
          <textarea
            className="min-h-[80px] w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-xs"
            value={block.rows.map((r) => r.join(" | ")).join("\n")}
            onChange={(e) =>
              onChange({
                ...block,
                rows: e.target.value
                  .split("\n")
                  .map((line) => line.split("|").map((c) => c.trim())),
              })
            }
            placeholder="Строки: ячейка | ячейка"
          />
          <Input
            value={block.caption ?? ""}
            onChange={(e) => onChange({ ...block, caption: e.target.value || undefined })}
            placeholder="Подпись (необязательно)"
          />
        </div>
      );

    case "map":
      return (
        <div className="grid gap-2 sm:grid-cols-3">
          <Input
            type="number"
            step="any"
            value={block.lat}
            onChange={(e) => onChange({ ...block, lat: Number(e.target.value) })}
            placeholder="Широта"
          />
          <Input
            type="number"
            step="any"
            value={block.lng}
            onChange={(e) => onChange({ ...block, lng: Number(e.target.value) })}
            placeholder="Долгота"
          />
          <Input
            value={block.label}
            onChange={(e) => onChange({ ...block, label: e.target.value })}
            placeholder="Подпись"
          />
        </div>
      );

    case "ticket-link":
      return (
        <div className="space-y-2">
          <Input
            value={block.url}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
            placeholder="URL"
          />
          <Input
            value={block.label}
            onChange={(e) => onChange({ ...block, label: e.target.value })}
            placeholder="Текст ссылки"
          />
        </div>
      );

    case "seasons":
      return (
        <div className="space-y-3">
          {block.items.map((item, index) => (
            <div key={index} className="rounded-xl border border-gray-100 p-2 space-y-1">
              <Input
                value={item.name}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...items[index], name: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="Сезон"
              />
              <textarea
                className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs"
                value={listToLines(item.pros)}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...items[index], pros: linesToList(e.target.value) };
                  onChange({ ...block, items });
                }}
                placeholder="Плюсы (по строкам)"
              />
              <textarea
                className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs"
                value={listToLines(item.cons)}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...items[index], cons: linesToList(e.target.value) };
                  onChange({ ...block, items });
                }}
                placeholder="Минусы (по строкам)"
              />
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                ...block,
                items: [...block.items, { name: "Сезон", pros: [], cons: [] }],
              })
            }
          >
            + Сезон
          </Button>
          <textarea
            className="min-h-[48px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={block.conclusion ?? ""}
            onChange={(e) => onChange({ ...block, conclusion: e.target.value || undefined })}
            placeholder="Вывод (необязательно)"
          />
        </div>
      );

    case "budget":
      return (
        <div className="space-y-2">
          {block.items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={item.label}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...items[index], label: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="Статья"
              />
              <Input
                value={item.value}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...items[index], value: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="Сумма"
              />
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({ ...block, items: [...block.items, { label: "", value: "" }] })
            }
          >
            + Строка
          </Button>
          <Input
            value={block.note ?? ""}
            onChange={(e) => onChange({ ...block, note: e.target.value || undefined })}
            placeholder="Примечание"
          />
        </div>
      );

    case "media":
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={block.src}
              onChange={(e) => onChange({ ...block, src: e.target.value })}
              placeholder="/media/... или https://"
              className="font-mono text-xs"
            />
            {onPickMedia ? (
              <Button type="button" size="sm" variant="outline" onClick={onPickMedia}>
                Выбрать
              </Button>
            ) : null}
          </div>
          <Input
            value={block.alt}
            onChange={(e) => onChange({ ...block, alt: e.target.value })}
            placeholder="Alt-текст"
          />
          <Input
            value={block.caption ?? ""}
            onChange={(e) => onChange({ ...block, caption: e.target.value || undefined })}
            placeholder="Подпись"
          />
        </div>
      );

    case "image-text":
      return (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={block.src}
              onChange={(e) => onChange({ ...block, src: e.target.value })}
              placeholder="Адрес фотографии"
              aria-label="Адрес фотографии"
              className="font-mono text-xs"
            />
            {onPickMedia ? (
              <Button type="button" size="sm" variant="outline" onClick={onPickMedia}>
                Выбрать
              </Button>
            ) : null}
          </div>
          <Input
            value={block.alt}
            onChange={(e) => onChange({ ...block, alt: e.target.value })}
            placeholder="Что изображено — для доступности"
            aria-label="Описание фотографии"
          />
          <Input
            value={block.title}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
            placeholder="Заголовок истории"
            aria-label="Заголовок"
          />
          <Textarea
            value={block.body}
            onChange={(e) => onChange({ ...block, body: e.target.value })}
            placeholder="Текст рядом с фотографией"
            aria-label="Основной текст"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <NativeSelect
              value={block.imagePosition ?? "left"}
              onChange={(e) =>
                onChange({
                  ...block,
                  imagePosition: e.target.value as typeof block.imagePosition,
                })
              }
              aria-label="Положение фотографии"
            >
              <option value="left">Фото слева</option>
              <option value="right">Фото справа</option>
            </NativeSelect>
            <Input
              value={block.caption ?? ""}
              onChange={(e) => onChange({ ...block, caption: e.target.value || undefined })}
              placeholder="Подпись на фото"
              aria-label="Подпись на фотографии"
            />
          </div>
        </div>
      );

    case "author-card":
      return (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={block.name}
              onChange={(e) => onChange({ ...block, name: e.target.value })}
              placeholder="Имя автора"
              aria-label="Имя автора"
            />
            <Input
              value={block.role ?? ""}
              onChange={(e) => onChange({ ...block, role: e.target.value || undefined })}
              placeholder="Автор, эксперт, проводник"
              aria-label="Роль автора"
            />
          </div>
          <Textarea
            value={block.bio}
            onChange={(e) => onChange({ ...block, bio: e.target.value })}
            placeholder="Коротко об опыте и связи автора с Аргентиной"
            aria-label="Описание автора"
          />
          <div className="flex gap-2">
            <Input
              value={block.avatarSrc ?? ""}
              onChange={(e) => onChange({ ...block, avatarSrc: e.target.value || undefined })}
              placeholder="Адрес портрета"
              aria-label="Адрес портрета"
              className="font-mono text-xs"
            />
            {onPickMedia ? (
              <Button type="button" size="sm" variant="outline" onClick={onPickMedia}>
                Выбрать
              </Button>
            ) : null}
          </div>
          <Input
            value={block.avatarAlt ?? ""}
            onChange={(e) => onChange({ ...block, avatarAlt: e.target.value || undefined })}
            placeholder="Описание портрета"
            aria-label="Описание портрета"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={block.href ?? ""}
              onChange={(e) => onChange({ ...block, href: e.target.value || undefined })}
              placeholder="Ссылка на страницу автора"
              aria-label="Ссылка на страницу автора"
            />
            <Input
              value={block.linkLabel ?? ""}
              onChange={(e) => onChange({ ...block, linkLabel: e.target.value || undefined })}
              placeholder="Текст ссылки: Об авторе"
              aria-label="Текст ссылки"
            />
          </div>
        </div>
      );

    case "facts-grid":
      return (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_10rem]">
            <Input
              value={block.title ?? ""}
              onChange={(e) => onChange({ ...block, title: e.target.value || undefined })}
              placeholder="Заголовок блока"
              aria-label="Заголовок блока фактов"
            />
            <NativeSelect
              value={block.columns ?? 3}
              onChange={(e) =>
                onChange({
                  ...block,
                  columns: Number(e.target.value) as typeof block.columns,
                })
              }
              aria-label="Количество колонок"
            >
              <option value={2}>2 колонки</option>
              <option value={3}>3 колонки</option>
              <option value={4}>4 колонки</option>
            </NativeSelect>
          </div>
          {block.items.map((item, index) => (
            <fieldset key={index} className="space-y-2 rounded-xl border border-gray-100 p-3">
              <legend className="px-1 text-xs font-medium text-slate">Факт {index + 1}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={item.label}
                  onChange={(e) => {
                    const items = [...block.items];
                    items[index] = { ...items[index], label: e.target.value };
                    onChange({ ...block, items });
                  }}
                  placeholder="Параметр: Когда ехать"
                  aria-label={`Название факта ${index + 1}`}
                />
                <Input
                  value={item.value}
                  onChange={(e) => {
                    const items = [...block.items];
                    items[index] = { ...items[index], value: e.target.value };
                    onChange({ ...block, items });
                  }}
                  placeholder="Значение: Октябрь — апрель"
                  aria-label={`Значение факта ${index + 1}`}
                />
              </div>
              <div className="flex gap-2">
                <Input
                  value={item.description ?? ""}
                  onChange={(e) => {
                    const items = [...block.items];
                    items[index] = {
                      ...items[index],
                      description: e.target.value || undefined,
                    };
                    onChange({ ...block, items });
                  }}
                  placeholder="Пояснение (необязательно)"
                  aria-label={`Пояснение к факту ${index + 1}`}
                />
                {block.items.length > 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="shrink-0 text-error"
                    onClick={() =>
                      onChange({
                        ...block,
                        items: block.items.filter((_, itemIndex) => itemIndex !== index),
                      })
                    }
                    aria-label={`Удалить факт ${index + 1}`}
                  >
                    Удалить
                  </Button>
                ) : null}
              </div>
            </fieldset>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                ...block,
                items: [...block.items, { label: "", value: "" }],
              })
            }
          >
            + Добавить факт
          </Button>
        </div>
      );

    case "quote":
      return (
        <div className="space-y-3">
          <Textarea
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Текст цитаты"
            aria-label="Текст цитаты"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={block.author ?? ""}
              onChange={(e) => onChange({ ...block, author: e.target.value || undefined })}
              placeholder="Автор цитаты"
              aria-label="Автор цитаты"
            />
            <Input
              value={block.context ?? ""}
              onChange={(e) => onChange({ ...block, context: e.target.value || undefined })}
              placeholder="Роль или источник"
              aria-label="Источник цитаты"
            />
          </div>
        </div>
      );

    case "infobox":
      return (
        <div className="space-y-2">
          <NativeSelect
            value={block.variant}
            onChange={(e) =>
              onChange({ ...block, variant: e.target.value as typeof block.variant })
            }
          >
            <option value="important">Важно</option>
            <option value="tip">Совет</option>
            <option value="warning">Предупреждение</option>
          </NativeSelect>
          <Input
            value={block.title}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
            placeholder="Заголовок"
          />
          <textarea
            className="min-h-[72px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={block.body}
            onChange={(e) => onChange({ ...block, body: e.target.value })}
            placeholder="Текст"
          />
        </div>
      );

    case "accordion":
      return (
        <div className="space-y-2">
          {block.items.map((item, index) => (
            <div key={index} className="space-y-1 rounded-lg border border-gray-100 p-2">
              <Input
                value={item.title}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...items[index], title: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="Заголовок"
              />
              <textarea
                className="min-h-[56px] w-full rounded-lg border border-gray-200 px-2 py-1 text-sm"
                value={item.body}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...items[index], body: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="Содержимое"
              />
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({ ...block, items: [...block.items, { title: "", body: "" }] })
            }
          >
            + Пункт
          </Button>
        </div>
      );

    case "comparison-table":
      return (
        <div className="space-y-2">
          <Input
            value={block.headers.join(" | ")}
            onChange={(e) =>
              onChange({
                ...block,
                headers: e.target.value.split("|").map((h) => h.trim()),
              })
            }
            placeholder="Заголовки через |"
          />
          <textarea
            className="min-h-[80px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono"
            value={block.rows.map((row) => row.join(" | ")).join("\n")}
            onChange={(e) =>
              onChange({
                ...block,
                rows: e.target.value
                  .split("\n")
                  .filter(Boolean)
                  .map((line) => line.split("|").map((cell) => cell.trim())),
              })
            }
            placeholder="Строки: ячейки через |"
          />
          <Input
            type="number"
            min={0}
            value={block.highlightColumn ?? 0}
            onChange={(e) =>
              onChange({
                ...block,
                highlightColumn: Number(e.target.value),
              })
            }
            placeholder="Индекс рекомендуемой колонки"
          />
          <NativeSelect
            value={block.mobileLayout ?? "cards"}
            onChange={(e) =>
              onChange({
                ...block,
                mobileLayout: e.target.value as NonNullable<typeof block.mobileLayout>,
              })
            }
          >
            <option value="cards">mobile: cards</option>
            <option value="stacked">mobile: stacked</option>
            <option value="tabs">mobile: tabs</option>
            <option value="scroll">mobile: scroll</option>
          </NativeSelect>
        </div>
      );

    case "cta":
      return (
        <div className="space-y-2">
          <Input
            value={block.label}
            onChange={(e) => onChange({ ...block, label: e.target.value })}
            placeholder="Текст кнопки"
          />
          <Input
            value={block.href}
            onChange={(e) => onChange({ ...block, href: e.target.value })}
            placeholder="/tours/slug или https://"
          />
          <NativeSelect
            value={block.variant ?? "primary"}
            onChange={(e) =>
              onChange({ ...block, variant: e.target.value as typeof block.variant })
            }
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="outline">Outline</option>
          </NativeSelect>
        </div>
      );

    case "tour-booking":
      return (
        <div className="space-y-2">
          <Input
            value={block.tourSlug}
            onChange={(e) => onChange({ ...block, tourSlug: e.target.value })}
            placeholder="slug тура"
          />
          <Input
            value={block.label ?? ""}
            onChange={(e) => onChange({ ...block, label: e.target.value || undefined })}
            placeholder="Текст кнопки"
          />
          <label className="flex items-center gap-2 text-xs text-slate">
            <input
              type="checkbox"
              checked={block.showPrice !== false}
              onChange={(e) => onChange({ ...block, showPrice: e.target.checked })}
            />
            Упоминать стоимость
          </label>
        </div>
      );

    case "route-map":
      return (
        <div className="space-y-2">
          {block.points.map((point, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-3">
              <Input
                value={point.label}
                onChange={(e) => {
                  const points = [...block.points];
                  points[index] = { ...points[index], label: e.target.value };
                  onChange({ ...block, points });
                }}
                placeholder="Название"
              />
              <Input
                type="number"
                step="any"
                value={point.lat}
                onChange={(e) => {
                  const points = [...block.points];
                  points[index] = { ...points[index], lat: Number(e.target.value) };
                  onChange({ ...block, points });
                }}
                placeholder="lat"
              />
              <Input
                type="number"
                step="any"
                value={point.lng}
                onChange={(e) => {
                  const points = [...block.points];
                  points[index] = { ...points[index], lng: Number(e.target.value) };
                  onChange({ ...block, points });
                }}
                placeholder="lng"
              />
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                ...block,
                points: [...block.points, { lat: -34.6, lng: -58.38, label: "Точка" }],
              })
            }
          >
            + Точка
          </Button>
        </div>
      );

    case "gallery":
      return (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block space-y-1 text-xs text-slate">
              Вид галереи
              <NativeSelect
                value={block.variant ?? "grid"}
                onChange={(e) =>
                  onChange({
                    ...block,
                    variant: e.target.value as BlogGalleryVariant,
                  })
                }
              >
                {GALLERY_VARIANT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <label className="block space-y-1 text-xs text-slate">
              Колонки (для сетки)
              <NativeSelect
                value={String(block.columns ?? 3)}
                onChange={(e) =>
                  onChange({
                    ...block,
                    columns: Number(e.target.value) as 2 | 3 | 4,
                  })
                }
              >
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </NativeSelect>
            </label>
          </div>
          {block.items.map((item, index) => (
            <div key={index} className="space-y-2 rounded-xl border border-gray-100 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">
                  Кадр {index + 1}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-red-600"
                  onClick={() =>
                    onChange({
                      ...block,
                      items: block.items.filter((_, i) => i !== index),
                    })
                  }
                >
                  Удалить
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  value={item.src}
                  onChange={(e) => {
                    const items = [...block.items];
                    items[index] = { ...items[index], src: e.target.value };
                    onChange({ ...block, items });
                  }}
                  placeholder="/media/…"
                  className="font-mono text-xs"
                />
                {onPickMedia ? (
                  <Button type="button" size="sm" variant="outline" onClick={onPickMedia}>
                    Медиа
                  </Button>
                ) : null}
              </div>
              <Input
                value={item.alt}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...items[index], alt: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="Alt (обязательно)"
              />
              <Input
                value={item.caption ?? ""}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = {
                    ...items[index],
                    caption: e.target.value.trim() ? e.target.value : undefined,
                  };
                  onChange({ ...block, items });
                }}
                placeholder="Подпись (необязательно)"
              />
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({ ...block, items: [...block.items, { src: "", alt: "" }] })
            }
          >
            + Фото
          </Button>
        </div>
      );

    case "video":
      return (
        <div className="space-y-2">
          <NativeSelect
            value={block.provider}
            onChange={(e) =>
              onChange({ ...block, provider: e.target.value as typeof block.provider })
            }
          >
            <option value="youtube">YouTube</option>
            <option value="vimeo">Vimeo</option>
          </NativeSelect>
          <Input
            value={block.videoId}
            onChange={(e) => onChange({ ...block, videoId: e.target.value })}
            placeholder="ID видео (dQw4w9WgXcQ)"
          />
          <Input
            value={block.title ?? ""}
            onChange={(e) => onChange({ ...block, title: e.target.value || undefined })}
            placeholder="Заголовок"
          />
          <Input
            value={block.caption ?? ""}
            onChange={(e) => onChange({ ...block, caption: e.target.value || undefined })}
            placeholder="Подпись под видео"
          />
        </div>
      );

    case "content-embed":
      return (
        <div className="space-y-2">
          <NativeSelect
            value={block.embedKind}
            onChange={(e) =>
              onChange({ ...block, embedKind: e.target.value as typeof block.embedKind })
            }
          >
            <option value="tour">Тур</option>
            <option value="excursion">Экскурсия</option>
            <option value="article">Статья блога</option>
            <option value="guide">Путеводитель</option>
          </NativeSelect>
          <Input
            value={block.slug}
            onChange={(e) => onChange({ ...block, slug: e.target.value })}
            placeholder="slug"
          />
          <Input
            value={block.title ?? ""}
            onChange={(e) => onChange({ ...block, title: e.target.value || undefined })}
            placeholder="Подпись (необязательно)"
          />
        </div>
      );

    case "widget":
      return (
        <div className="space-y-2">
          <Input
            value={block.widgetKey}
            onChange={(e) => onChange({ ...block, widgetKey: e.target.value })}
            placeholder="flights-teaser / map-hub / …"
          />
          <Input
            value={block.title ?? ""}
            onChange={(e) => onChange({ ...block, title: e.target.value || undefined })}
            placeholder="Заголовок"
          />
        </div>
      );

    case "lead":
      return (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block space-y-1 text-xs text-slate">
              Вид лида
              <NativeSelect
                value={block.variant ?? "default"}
                onChange={(e) =>
                  onChange({
                    ...block,
                    variant: e.target.value as NonNullable<typeof block.variant>,
                  })
                }
              >
                <option value="default">Обычный</option>
                <option value="wide">Широкий</option>
                <option value="compact">Компактный</option>
                <option value="with-icon">С иконкой</option>
                <option value="with-author-note">С заметкой автора</option>
              </NativeSelect>
            </label>
            <DensitySelect
              value={block.density}
              onChange={(density) => onChange({ ...block, density })}
            />
          </div>
          <textarea
            className="min-h-[80px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Вводный абзац…"
          />
        </div>
      );

    case "photo":
      return (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block space-y-1 text-xs text-slate">
              Вид фотографии
              <NativeSelect
                value={block.variant ?? "content-width"}
                onChange={(e) =>
                  onChange({
                    ...block,
                    variant: e.target.value as BlogPhotoVariant,
                  })
                }
              >
                {PHOTO_VARIANT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <DensitySelect
              value={block.density}
              onChange={(density) => onChange({ ...block, density })}
            />
          </div>
          <Input
            value={block.src}
            onChange={(e) => onChange({ ...block, src: e.target.value })}
            placeholder="/media/…"
          />
          <Input
            value={block.alt}
            onChange={(e) => onChange({ ...block, alt: e.target.value })}
            placeholder="Alt (обязательно)"
          />
          <Input
            value={block.caption ?? ""}
            onChange={(e) => onChange({ ...block, caption: e.target.value || undefined })}
            placeholder="Подпись (не повторяйте alt)"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={block.author ?? ""}
              onChange={(e) => onChange({ ...block, author: e.target.value || undefined })}
              placeholder="Автор / кредиты"
            />
            <Input
              value={block.license ?? ""}
              onChange={(e) => onChange({ ...block, license: e.target.value || undefined })}
              placeholder="Лицензия"
            />
          </div>
          <Input
            value={block.sourceUrl ?? ""}
            onChange={(e) => onChange({ ...block, sourceUrl: e.target.value || undefined })}
            placeholder="URL источника"
            className="font-mono text-xs"
          />
          {onPickMedia ? (
            <Button type="button" variant="secondary" size="sm" onClick={onPickMedia}>
              Выбрать из медиатеки
            </Button>
          ) : null}
        </div>
      );

    case "article-summary":
      return (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block space-y-1 text-xs text-slate">
              Вид сводки
              <NativeSelect
                value={block.variant ?? "cards"}
                onChange={(e) =>
                  onChange({
                    ...block,
                    variant: e.target.value as BlogArticleSummaryVariant,
                  })
                }
              >
                {SUMMARY_VARIANT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <DensitySelect
              value={block.density}
              onChange={(density) => onChange({ ...block, density })}
            />
          </div>
          <Input
            value={block.title ?? ""}
            onChange={(e) => onChange({ ...block, title: e.target.value || undefined })}
            placeholder="Заголовок блока"
          />
          {block.items.map((item, index) => (
            <div key={index} className="space-y-2 rounded-xl border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">
                  Пункт {index + 1}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-red-600"
                  onClick={() =>
                    onChange({
                      ...block,
                      items: block.items.filter((_, i) => i !== index),
                    })
                  }
                >
                  Удалить
                </Button>
              </div>
              <Input
                value={item.title}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...item, title: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="Заголовок пункта"
              />
              <Textarea
                value={item.body}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...item, body: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="Текст"
                className="min-h-[64px]"
              />
              <Input
                value={item.href ?? ""}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = {
                    ...item,
                    href: e.target.value.trim() ? e.target.value : undefined,
                  };
                  onChange({ ...block, items });
                }}
                placeholder="Ссылка (необязательно)"
                className="font-mono text-xs"
              />
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                ...block,
                items: [...block.items, { title: "", body: "" }],
              })
            }
          >
            + Пункт сводки
          </Button>
        </div>
      );

    case "sources":
      return (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block space-y-1 text-xs text-slate">
              Вид списка
              <NativeSelect
                value={block.variant ?? "grouped"}
                onChange={(e) =>
                  onChange({
                    ...block,
                    variant: e.target.value as NonNullable<typeof block.variant>,
                  })
                }
              >
                <option value="grouped">Группами</option>
                <option value="compact">Компактно</option>
                <option value="expandable">Раскрываемый</option>
              </NativeSelect>
            </label>
            <DensitySelect
              value={block.density}
              onChange={(density) => onChange({ ...block, density })}
            />
          </div>
          <Input
            value={block.title ?? ""}
            onChange={(e) => onChange({ ...block, title: e.target.value || undefined })}
            placeholder="Источники и дата проверки"
          />
          {block.items.map((item, index) => (
            <div key={index} className="space-y-2 rounded-xl border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">
                  Источник {index + 1}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-red-600"
                  onClick={() =>
                    onChange({
                      ...block,
                      items: block.items.filter((_, i) => i !== index),
                    })
                  }
                >
                  Удалить
                </Button>
              </div>
              <Input
                value={item.title}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...item, title: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="Название"
              />
              <Input
                value={item.url}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...item, url: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="https://…"
                className="font-mono text-xs"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <NativeSelect
                  value={item.type ?? "official"}
                  onChange={(e) => {
                    const items = [...block.items];
                    items[index] = {
                      ...item,
                      type: e.target.value as BlogSourceGroup,
                    };
                    onChange({ ...block, items });
                  }}
                >
                  {SOURCE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </NativeSelect>
                <Input
                  value={item.publisher ?? ""}
                  onChange={(e) => {
                    const items = [...block.items];
                    items[index] = {
                      ...item,
                      publisher: e.target.value.trim() ? e.target.value : undefined,
                    };
                    onChange({ ...block, items });
                  }}
                  placeholder="Издатель"
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                ...block,
                items: [...block.items, { title: "", url: "", type: "official" }],
              })
            }
          >
            + Источник
          </Button>
        </div>
      );

    case "country-tip":
      return (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block space-y-1 text-xs text-slate">
              Вид совета
              <NativeSelect
                value={block.variant ?? "ru-traveler"}
                onChange={(e) =>
                  onChange({
                    ...block,
                    variant: e.target.value as NonNullable<typeof block.variant>,
                  })
                }
              >
                <option value="ru-traveler">Русскоязычному путешественнику</option>
                <option value="different-practice">Отличается от привычной практики</option>
                <option value="living-in-argentina">Если живёте в Аргентине</option>
                <option value="scouting-trip">Поездка-разведка</option>
              </NativeSelect>
            </label>
            <DensitySelect
              value={block.density}
              onChange={(density) => onChange({ ...block, density })}
            />
          </div>
          <Input
            value={block.title ?? ""}
            onChange={(e) => onChange({ ...block, title: e.target.value || undefined })}
            placeholder="Заголовок совета (необязательно)"
          />
          <textarea
            className="min-h-[90px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={block.body}
            onChange={(e) => onChange({ ...block, body: e.target.value })}
            placeholder="Текст совета…"
          />
        </div>
      );

    case "phrasebook":
      return (
        <div className="space-y-3">
          <DensitySelect
            value={block.density}
            onChange={(density) => onChange({ ...block, density })}
          />
          <Input
            value={block.title ?? ""}
            onChange={(e) => onChange({ ...block, title: e.target.value || undefined })}
            placeholder="Полезные фразы"
          />
          <Input
            value={block.category ?? ""}
            onChange={(e) => onChange({ ...block, category: e.target.value || undefined })}
            placeholder="Категория (ресторан, транспорт…)"
          />
          {block.items.map((item, index) => (
            <div key={index} className="space-y-2 rounded-xl border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">
                  Фраза {index + 1}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-red-600"
                  onClick={() =>
                    onChange({
                      ...block,
                      items: block.items.filter((_, i) => i !== index),
                    })
                  }
                >
                  Удалить
                </Button>
              </div>
              <Input
                value={item.original}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...item, original: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="Оригинал (испанский)"
              />
              <Input
                value={item.translation}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...item, translation: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="Перевод"
              />
              <Input
                value={item.pronunciation ?? ""}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = {
                    ...item,
                    pronunciation: e.target.value.trim() ? e.target.value : undefined,
                  };
                  onChange({ ...block, items });
                }}
                placeholder="Произношение"
              />
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                ...block,
                items: [...block.items, { original: "", translation: "" }],
              })
            }
          >
            + Фраза
          </Button>
        </div>
      );

    case "option-selector":
      return (
        <div className="space-y-3">
          <DensitySelect
            value={block.density}
            onChange={(density) => onChange({ ...block, density })}
          />
          <Input
            value={block.title ?? ""}
            onChange={(e) => onChange({ ...block, title: e.target.value || undefined })}
            placeholder="Заголовок селектора"
          />
          <Textarea
            value={block.description ?? ""}
            onChange={(e) =>
              onChange({
                ...block,
                description: e.target.value.trim() ? e.target.value : undefined,
              })
            }
            placeholder="Краткое описание выбора"
            className="min-h-[56px]"
          />
          {block.options.map((item, index) => (
            <div key={index} className="space-y-2 rounded-xl border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">
                  Вариант {index + 1}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-red-600"
                  onClick={() =>
                    onChange({
                      ...block,
                      options: block.options.filter((_, i) => i !== index),
                    })
                  }
                >
                  Удалить
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={item.id}
                  onChange={(e) => {
                    const options = [...block.options];
                    options[index] = { ...item, id: e.target.value };
                    onChange({ ...block, options });
                  }}
                  placeholder="id (латиница)"
                  className="font-mono text-xs"
                />
                <Input
                  value={item.meta ?? ""}
                  onChange={(e) => {
                    const options = [...block.options];
                    options[index] = {
                      ...item,
                      meta: e.target.value.trim() ? e.target.value : undefined,
                    };
                    onChange({ ...block, options });
                  }}
                  placeholder="Мета (цена, длительность…)"
                />
              </div>
              <Input
                value={item.title}
                onChange={(e) => {
                  const options = [...block.options];
                  options[index] = { ...item, title: e.target.value };
                  onChange({ ...block, options });
                }}
                placeholder="Название варианта"
              />
              <Textarea
                value={item.summary}
                onChange={(e) => {
                  const options = [...block.options];
                  options[index] = { ...item, summary: e.target.value };
                  onChange({ ...block, options });
                }}
                placeholder="Краткое описание"
                className="min-h-[56px]"
              />
              <Textarea
                value={item.details ?? ""}
                onChange={(e) => {
                  const options = [...block.options];
                  options[index] = {
                    ...item,
                    details: e.target.value.trim() ? e.target.value : undefined,
                  };
                  onChange({ ...block, options });
                }}
                placeholder="Подробности (необязательно)"
                className="min-h-[56px]"
              />
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                ...block,
                options: [
                  ...block.options,
                  { id: `option-${block.options.length + 1}`, title: "", summary: "" },
                ],
              })
            }
          >
            + Вариант
          </Button>
        </div>
      );

    case "pros-cons":
      return (
        <div className="space-y-2">
          <DensitySelect
            value={block.density}
            onChange={(density) => onChange({ ...block, density })}
          />
          <Input
            value={block.title ?? ""}
            onChange={(e) => onChange({ ...block, title: e.target.value || undefined })}
            placeholder="Плюсы и минусы"
          />
          <label className="block space-y-1 text-xs text-slate">
            Плюсы (по строке)
            <textarea
              className="min-h-[72px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal"
              value={listToLines(block.pros.items)}
              onChange={(e) =>
                onChange({
                  ...block,
                  pros: { ...block.pros, items: linesToList(e.target.value) },
                })
              }
            />
          </label>
          <label className="block space-y-1 text-xs text-slate">
            Минусы (по строке)
            <textarea
              className="min-h-[72px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal"
              value={listToLines(block.cons.items)}
              onChange={(e) =>
                onChange({
                  ...block,
                  cons: { ...block.cons, items: linesToList(e.target.value) },
                })
              }
            />
          </label>
          <Input
            value={block.recommendation ?? ""}
            onChange={(e) =>
              onChange({ ...block, recommendation: e.target.value || undefined })
            }
            placeholder="Рекомендация (необязательно)"
          />
        </div>
      );

    case "season-matrix":
      return (
        <div className="space-y-3">
          <p className="text-xs text-slate">
            Матрица сезонов Аргентины. Данные компонента общие для сайта; ниже — настройки
            отображения.
          </p>
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input
              type="checkbox"
              checked={block.highlightCurrentMonth !== false}
              onChange={(e) =>
                onChange({ ...block, highlightCurrentMonth: e.target.checked })
              }
            />
            Подсвечивать текущий месяц
          </label>
        </div>
      );

    case "tourism-infographic":
      return (
        <div className="space-y-3">
          <p className="text-xs text-slate">
            Инфографика туризма. Можно выбрать компактный вид для узких колонок и хабов.
          </p>
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input
              type="checkbox"
              checked={block.compact === true}
              onChange={(e) => onChange({ ...block, compact: e.target.checked })}
            />
            Компактный вид
          </label>
        </div>
      );

    case "tourism-timeline":
      return (
        <p className="text-xs text-slate">
          Хронология туризма — встроенный виджет с актуальной редакционной версией на сайте.
          Текстовые поля этого блока пока не редактируются в CMS.
        </p>
      );

    case "hero-banner":
      return (
        <div className="space-y-2">
          <DensitySelect
            value={block.density}
            onChange={(density) => onChange({ ...block, density })}
          />
          <Input
            value={block.eyebrow ?? ""}
            onChange={(e) => onChange({ ...block, eyebrow: e.target.value || undefined })}
            placeholder="Надзаголовок"
          />
          <Input
            value={block.title}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
            placeholder="Заголовок"
          />
          <textarea
            className="min-h-[72px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={block.lede ?? ""}
            onChange={(e) => onChange({ ...block, lede: e.target.value || undefined })}
            placeholder="Короткий лид"
          />
          <Input
            value={block.imageSrc ?? ""}
            onChange={(e) => onChange({ ...block, imageSrc: e.target.value || undefined })}
            placeholder="Фон: /media/…"
          />
          <Input
            value={block.imageAlt ?? ""}
            onChange={(e) => onChange({ ...block, imageAlt: e.target.value || undefined })}
            placeholder="Alt фона"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={block.primaryCta?.label ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  primaryCta: e.target.value.trim()
                    ? {
                        label: e.target.value,
                        href: block.primaryCta?.href ?? "/",
                      }
                    : undefined,
                })
              }
              placeholder="Текст основной кнопки"
            />
            <Input
              value={block.primaryCta?.href ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  primaryCta:
                    block.primaryCta?.label || e.target.value.trim()
                      ? {
                          label: block.primaryCta?.label ?? "Подробнее",
                          href: e.target.value || "/",
                        }
                      : undefined,
                })
              }
              placeholder="Ссылка основной кнопки"
              className="font-mono text-xs"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={block.secondaryCta?.label ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  secondaryCta: e.target.value.trim()
                    ? {
                        label: e.target.value,
                        href: block.secondaryCta?.href ?? "/",
                      }
                    : undefined,
                })
              }
              placeholder="Текст доп. кнопки"
            />
            <Input
              value={block.secondaryCta?.href ?? ""}
              onChange={(e) =>
                onChange({
                  ...block,
                  secondaryCta:
                    block.secondaryCta?.label || e.target.value.trim()
                      ? {
                          label: block.secondaryCta?.label ?? "Ещё",
                          href: e.target.value || "/",
                        }
                      : undefined,
                })
              }
              placeholder="Ссылка доп. кнопки"
              className="font-mono text-xs"
            />
          </div>
          {onPickMedia ? (
            <Button type="button" variant="secondary" size="sm" onClick={onPickMedia}>
              Выбрать фон из медиатеки
            </Button>
          ) : null}
        </div>
      );

    case "related-links":
    case "hub-cta-row":
      return (
        <div className="space-y-3">
          <DensitySelect
            value={block.density}
            onChange={(density) => onChange({ ...block, density })}
          />
          <Input
            value={block.title ?? ""}
            onChange={(e) => onChange({ ...block, title: e.target.value || undefined })}
            placeholder="Заголовок блока"
          />
          <LinkItemsEditor
            items={block.items}
            onChange={(items) => onChange({ ...block, items })}
            addLabel={block.type === "hub-cta-row" ? "+ Карточка действия" : "+ Ссылка"}
          />
        </div>
      );

    default:
      return null;
  }
}
