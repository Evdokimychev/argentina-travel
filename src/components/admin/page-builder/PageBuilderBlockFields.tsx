"use client";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { CALLOUT_VARIANTS } from "@/lib/cms/page-builder/block-registry";
import type { BlogBodyBlock } from "@/types/blog-content-blocks";

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
        <div className="space-y-2">
          {block.items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={item.src}
                onChange={(e) => {
                  const items = [...block.items];
                  items[index] = { ...items[index], src: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="URL"
                className="font-mono text-xs"
              />
              {onPickMedia ? (
                <Button type="button" size="sm" variant="outline" onClick={onPickMedia}>
                  +
                </Button>
              ) : null}
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

    default:
      return null;
  }
}
