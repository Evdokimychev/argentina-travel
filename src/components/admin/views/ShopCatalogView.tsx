"use client";

import { useState } from "react";
import { Archive, ImagePlus, PackagePlus, Plus, Save, Store } from "lucide-react";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import CmsMediaPathField from "@/components/admin/CmsMediaPathField";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { AdminListSkeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAdminApi } from "@/hooks/useAdminApi";
import {
  slugifyShopValue,
  type AdminShopCategory,
  type ShopProductDraft,
} from "@/lib/admin/shop-catalog-contract";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import { formatShopMoney, type ShopProduct } from "@/types/shop-product";

type CatalogResponse = {
  products?: ShopProduct[];
  categories?: AdminShopCategory[];
  moduleEnabled?: boolean;
};

const STATUS_LABELS = { draft: "Черновик", published: "Опубликован", archived: "В архиве" } as const;
const AVAILABILITY_LABELS = {
  unlimited: "Без ограничения остатка",
  in_stock: "В наличии",
  out_of_stock: "Нет в наличии",
  preorder: "Предзаказ",
} as const;

function emptyDraft(categoryId: string): ShopProductDraft {
  return {
    categoryId,
    slug: "",
    title: "",
    description: "",
    format: "",
    deliveryType: "digital",
    priceMinor: 0,
    currency: "USD",
    availability: "unlimited",
    stockQuantity: null,
    status: "draft",
    seoTitle: null,
    seoDescription: null,
    images: [],
  };
}

function draftFromProduct(product: ShopProduct): ShopProductDraft {
  return {
    categoryId: product.categoryId,
    slug: product.slug,
    title: product.title,
    description: product.description,
    format: product.format,
    deliveryType: product.deliveryType,
    priceMinor: product.priceMinor,
    currency: product.currency,
    availability: product.availability,
    stockQuantity: product.stockQuantity,
    status: product.status === "archived" ? "draft" : product.status,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    images: product.images,
  };
}

function moneyText(minor: number): string {
  return `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, "0")}`;
}

function parseMoneyText(value: string): number | null {
  const match = value.trim().match(/^(\d{1,10})(?:[.,](\d{0,2}))?$/);
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  const minor = whole * 100 + fraction;
  return Number.isSafeInteger(minor) ? minor : null;
}

async function apiMutation(url: string, method: "POST" | "PATCH" | "DELETE", body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Не удалось сохранить изменения");
}

export default function ShopCatalogView() {
  const { data, loading, error, refresh } = useAdminApi<CatalogResponse>("/api/admin/shop/catalog");
  const products = data?.products ?? [];
  const categories = data?.categories ?? [];
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<ShopProductDraft | null>(null);
  const [priceInput, setPriceInput] = useState("0.00");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState({ slug: "", name: "", description: "", sortOrder: 10 });

  const selected = products.find((product) => product.id === selectedId) ?? null;
  const filtered = products.filter((product) => {
    const search = query.trim().toLowerCase();
    return (!search || `${product.title} ${product.slug}`.toLowerCase().includes(search))
      && (statusFilter === "all" || product.status === statusFilter)
      && (categoryFilter === "all" || product.categoryId === categoryFilter);
  });

  function startNew() {
    const categoryId = categories.find((category) => category.isActive)?.id ?? "";
    const next = emptyDraft(categoryId);
    setSelectedId("new");
    setDraft(next);
    setPriceInput("0.00");
    setNotice(null);
  }

  function editProduct(product: ShopProduct) {
    setSelectedId(product.id);
    setDraft(draftFromProduct(product));
    setPriceInput(moneyText(product.priceMinor));
    setNotice(null);
  }

  async function saveProduct() {
    if (!draft) return;
    const priceMinor = parseMoneyText(priceInput);
    if (priceMinor === null) {
      setNotice("Проверьте цену: используйте формат 19.00");
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const payload = { ...draft, priceMinor };
      if (payload.status === "published" && selected?.status !== "published") {
        const confirmed = window.confirm(
          "Опубликовать товар на сайте? Перед продолжением проверьте цену, остаток, изображение и SEO-описание.",
        );
        if (!confirmed) return;
      }
      if (selectedId === "new") {
        await apiMutation("/api/admin/shop/catalog", "POST", payload);
      } else if (selected) {
        await apiMutation(`/api/admin/shop/catalog/${selected.id}`, "PATCH", {
          ...payload,
          expectedVersion: selected.version,
          expectedUpdatedAt: selected.updatedAt,
        });
      }
      await refresh();
      setSelectedId(null);
      setDraft(null);
      setNotice("Товар сохранён");
    } catch (saveError) {
      setNotice(saveError instanceof Error ? saveError.message : "Не удалось сохранить товар");
    } finally {
      setBusy(false);
    }
  }

  async function archiveProduct() {
    if (!selected || !window.confirm(`Переместить «${selected.title}» в архив?`)) return;
    setBusy(true);
    try {
      await apiMutation(`/api/admin/shop/catalog/${selected.id}`, "DELETE", {
        expectedVersion: selected.version,
        expectedUpdatedAt: selected.updatedAt,
      });
      await refresh();
      setSelectedId(null);
      setDraft(null);
      setNotice("Товар перемещён в архив. История заказов сохранена.");
    } catch (archiveError) {
      setNotice(archiveError instanceof Error ? archiveError.message : "Не удалось архивировать товар");
    } finally {
      setBusy(false);
    }
  }

  async function saveCategory() {
    setBusy(true);
    setNotice(null);
    try {
      const current = categories.find((category) => category.id === selectedCategoryId);
      await apiMutation("/api/admin/shop/categories", current ? "PATCH" : "POST", current ? {
        ...categoryDraft,
        id: current.id,
        expectedVersion: current.version,
        expectedUpdatedAt: current.updatedAt,
      } : categoryDraft);
      await refresh();
      setSelectedCategoryId(null);
      setCategoryDraft({ slug: "", name: "", description: "", sortOrder: 10 });
      setNotice(current ? "Категория обновлена" : "Категория добавлена");
    } catch (categoryError) {
      setNotice(categoryError instanceof Error ? categoryError.message : "Не удалось добавить категорию");
    } finally {
      setBusy(false);
    }
  }

  async function archiveCategory() {
    const current = categories.find((category) => category.id === selectedCategoryId);
    if (!current || !window.confirm(`Переместить категорию «${current.name}» в архив?`)) return;
    setBusy(true);
    try {
      await apiMutation("/api/admin/shop/categories", "DELETE", {
        id: current.id,
        expectedVersion: current.version,
        expectedUpdatedAt: current.updatedAt,
      });
      await refresh();
      setSelectedCategoryId(null);
      setCategoryDraft({ slug: "", name: "", description: "", sortOrder: 10 });
      setNotice("Категория перемещена в архив");
    } catch (categoryError) {
      setNotice(categoryError instanceof Error ? categoryError.message : "Не удалось архивировать категорию");
    } finally {
      setBusy(false);
    }
  }

  return (
    <CapabilityGate capability="operations.shop">
      <AdminPageShell>
        <AdminPageHeader
          title="Каталог магазина"
          subtitle="Товары, цены, остатки, публикация и категории"
          actions={<Button onClick={startNew}><PackagePlus className="mr-2 h-4 w-4" />Новый товар</Button>}
        />

        {data && data.moduleEnabled === false ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Магазин сейчас скрыт на сайте. Товары можно подготовить, но посетители увидят их только после включения магазина в настройках сайта.
          </div>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {notice ? <p role="status" className="text-sm text-slate">{notice}</p> : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
          <section className={`${cabinetCardClass} overflow-hidden`}>
            <div className="grid gap-3 border-b border-gray-100 p-4 md:grid-cols-3">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти товар" aria-label="Поиск товаров" />
              <NativeSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Статус товара">
                <option value="all">Все статусы</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </NativeSelect>
              <NativeSelect value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Категория товара">
                <option value="all">Все категории</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </NativeSelect>
            </div>
            {loading ? <AdminListSkeleton rows={6} /> : filtered.length === 0 ? (
              <EmptyState variant="admin" icon={Store} title="Товары не найдены" description="Измените фильтры или добавьте первый товар." bordered={false} />
            ) : (
              <ul className="divide-y divide-gray-100">
                {filtered.map((product) => (
                  <li key={product.id}>
                    <button type="button" onClick={() => editProduct(product)} className={`w-full px-5 py-4 text-left hover:bg-gray-50 ${selectedId === product.id ? "bg-sky/5" : ""}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-charcoal">{product.title}</span>
                        <span className="text-sm font-semibold text-charcoal">{formatShopMoney(product.priceMinor, product.currency)}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate">{product.categoryName ?? "Без категории"} · {STATUS_LABELS[product.status]} · {AVAILABILITY_LABELS[product.availability]}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`${cabinetCardClass} space-y-4 p-5`}>
            {!draft ? <p className="text-sm text-slate">Выберите товар или создайте новый.</p> : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-heading text-lg font-bold text-charcoal">{selectedId === "new" ? "Новый товар" : "Редактирование"}</h2>
                  {selected ? <span className="text-xs text-slate">Версия {selected.version}</span> : null}
                </div>
                <label className="block space-y-1 text-sm"><span>Название</span><Input value={draft.title} onChange={(event) => setDraft((current) => current ? { ...current, title: event.target.value, slug: current.slug || slugifyShopValue(event.target.value) } : current)} /></label>
                <label className="block space-y-1 text-sm"><span>Адрес страницы</span><Input value={draft.slug} onChange={(event) => setDraft((current) => current ? { ...current, slug: slugifyShopValue(event.target.value) } : current)} placeholder="patagonia-guide" /></label>
                <label className="block space-y-1 text-sm"><span>Категория</span><NativeSelect value={draft.categoryId ?? ""} onChange={(event) => setDraft((current) => current ? { ...current, categoryId: event.target.value } : current)}>{categories.filter((category) => category.isActive).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</NativeSelect></label>
                <label className="block space-y-1 text-sm"><span>Описание</span><Textarea rows={5} value={draft.description} onChange={(event) => setDraft((current) => current ? { ...current, description: event.target.value } : current)} /></label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1 text-sm"><span>Цена</span><Input inputMode="decimal" value={priceInput} onChange={(event) => setPriceInput(event.target.value)} /></label>
                  <label className="block space-y-1 text-sm"><span>Валюта</span><Input maxLength={3} value={draft.currency} onChange={(event) => setDraft((current) => current ? { ...current, currency: event.target.value.toUpperCase() } : current)} /></label>
                </div>
                <label className="block space-y-1 text-sm"><span>Формат</span><Input value={draft.format} onChange={(event) => setDraft((current) => current ? { ...current, format: event.target.value } : current)} placeholder="PDF, 48 страниц" /></label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1 text-sm"><span>Доступность</span><NativeSelect value={draft.availability} onChange={(event) => { const availability = event.target.value as ShopProductDraft["availability"]; setDraft((current) => current ? { ...current, availability, stockQuantity: availability === "unlimited" ? null : availability === "out_of_stock" ? 0 : Math.max(1, current.stockQuantity ?? 1) } : current); }}>{Object.entries(AVAILABILITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</NativeSelect></label>
                  {draft.availability !== "unlimited" ? <label className="block space-y-1 text-sm"><span>Остаток</span><Input type="number" min={0} value={draft.stockQuantity ?? 0} onChange={(event) => setDraft((current) => current ? { ...current, stockQuantity: Number(event.target.value) } : current)} /></label> : null}
                </div>
                <label className="block space-y-1 text-sm"><span>Статус</span><NativeSelect value={draft.status} onChange={(event) => setDraft((current) => current ? { ...current, status: event.target.value as "draft" | "published" } : current)}><option value="draft">Черновик</option><option value="published">Опубликован</option></NativeSelect></label>
                <label className="block space-y-1 text-sm"><span>SEO-заголовок</span><Input maxLength={70} value={draft.seoTitle ?? ""} onChange={(event) => setDraft((current) => current ? { ...current, seoTitle: event.target.value || null } : current)} /></label>
                <label className="block space-y-1 text-sm"><span>SEO-описание</span><Textarea rows={3} maxLength={180} value={draft.seoDescription ?? ""} onChange={(event) => setDraft((current) => current ? { ...current, seoDescription: event.target.value || null } : current)} /></label>

                <div className="space-y-3">
                  <div className="flex items-center justify-between"><span className="text-sm font-medium">Изображения и подписи</span><Button type="button" size="sm" variant="outline" onClick={() => setDraft((current) => current ? { ...current, images: [...current.images, { url: "", alt: "" }] } : current)} disabled={draft.images.length >= 8}><ImagePlus className="mr-1 h-4 w-4" />Добавить</Button></div>
                  {draft.images.map((image, index) => (
                    <div key={`${index}-${image.url}`} className="grid gap-2 rounded-xl border border-gray-100 p-3">
                      <CmsMediaPathField value={image.url} onChange={(value) => setDraft((current) => current ? { ...current, images: current.images.map((item, itemIndex) => itemIndex === index ? { ...item, url: value } : item) } : current)} label={`Изображение ${index + 1}`} />
                      <div className="flex gap-2"><Input value={image.alt} placeholder="Что изображено" onChange={(event) => setDraft((current) => current ? { ...current, images: current.images.map((item, itemIndex) => itemIndex === index ? { ...item, alt: event.target.value } : item) } : current)} /><Button type="button" variant="ghost" onClick={() => setDraft((current) => current ? { ...current, images: current.images.filter((_, itemIndex) => itemIndex !== index) } : current)}>Убрать</Button></div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2"><Button onClick={() => void saveProduct()} disabled={busy}><Save className="mr-2 h-4 w-4" />Сохранить</Button>{selected && selected.status !== "archived" ? <Button variant="outline" onClick={() => void archiveProduct()} disabled={busy}><Archive className="mr-2 h-4 w-4" />В архив</Button> : null}<Button variant="ghost" onClick={() => { setSelectedId(null); setDraft(null); }}>Закрыть</Button></div>
              </>
            )}
          </section>
        </div>

        <section className={`${cabinetCardClass} space-y-4 p-5`}>
          <div><h2 className="font-heading text-lg font-bold text-charcoal">Категории</h2><p className="mt-1 text-sm text-slate">Категория помогает посетителям понять назначение товара.</p></div>
          <ul className="grid gap-2 md:grid-cols-2">{categories.map((category) => <li key={category.id} className="rounded-xl border border-gray-100 p-3 text-sm"><button type="button" className="w-full text-left" onClick={() => { setSelectedCategoryId(category.id); setCategoryDraft({ slug: category.slug, name: category.name, description: category.description ?? "", sortOrder: category.sortOrder }); }}><div className="flex justify-between gap-2"><span className="font-medium text-charcoal">{category.name}</span><span className="text-slate">{category.productCount} товаров</span></div><p className="mt-1 text-xs text-slate">/{category.slug} · {category.isActive ? "Активна" : "В архиве"}</p></button></li>)}</ul>
          <div className="grid items-end gap-3 md:grid-cols-5"><Input value={categoryDraft.name} placeholder="Название" onChange={(event) => setCategoryDraft((current) => ({ ...current, name: event.target.value, slug: current.slug || slugifyShopValue(event.target.value) }))} /><Input value={categoryDraft.slug} placeholder="Адрес" onChange={(event) => setCategoryDraft((current) => ({ ...current, slug: slugifyShopValue(event.target.value) }))} /><Input value={categoryDraft.description} placeholder="Короткое описание" onChange={(event) => setCategoryDraft((current) => ({ ...current, description: event.target.value }))} /><label className="space-y-1 text-xs text-slate"><span>Порядок (меньше — выше)</span><Input type="number" min={0} max={32767} value={categoryDraft.sortOrder} onChange={(event) => setCategoryDraft((current) => ({ ...current, sortOrder: Number(event.target.value) }))} /></label><Button onClick={() => void saveCategory()} disabled={busy}><Plus className="mr-2 h-4 w-4" />{selectedCategoryId ? "Сохранить" : "Добавить"}</Button></div>
          {selectedCategoryId ? <div className="flex gap-2"><Button variant="outline" onClick={() => void archiveCategory()} disabled={busy}>В архив</Button><Button variant="ghost" onClick={() => { setSelectedCategoryId(null); setCategoryDraft({ slug: "", name: "", description: "", sortOrder: 10 }); }}>Новая категория</Button></div> : null}
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
