"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cabinetCardClass, cabinetPanelClass } from "@/lib/cabinet-ui";
import { SHOP_ORDER_STATUS_LABELS } from "@/types/shop-order";

const TOKEN_KEY = "leads-admin-token";

type AdminTab = "leads" | "shop" | "tours";

type NewsletterRow = {
  id: string;
  email: string;
  source: string;
  locale: string | null;
  status: string;
  created_at: string;
};

type ContactRow = {
  id: string;
  kind: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  context: Record<string, unknown>;
  page_url: string | null;
  created_at: string;
};

type ShopOrderRow = {
  id: string;
  productTitle: string;
  productSlug: string;
  priceUsd: number;
  currency: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryUrl: string | null;
  notes: string | null;
  createdAt: string;
};

type TourContentRow = {
  id: string;
  slug: string;
  ownerUserId: string;
  status: string;
  title: string;
  publishedAt: string | null;
  updatedAt: string;
};

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function shopStatusLabel(status: string): string {
  return status in SHOP_ORDER_STATUS_LABELS
    ? SHOP_ORDER_STATUS_LABELS[status as keyof typeof SHOP_ORDER_STATUS_LABELS]
    : status;
}

export default function AdminLeadsPage() {
  const [token, setToken] = useState("");
  const [storedToken, setStoredToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("leads");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newsletter, setNewsletter] = useState<NewsletterRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [shopOrders, setShopOrders] = useState<ShopOrderRow[]>([]);
  const [tourRows, setTourRows] = useState<TourContentRow[]>([]);

  const load = useCallback(async (authToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${authToken}` };
      const [leadsRes, shopRes, toursRes] = await Promise.all([
        fetch("/api/admin/leads", { headers }),
        fetch("/api/admin/shop/orders", { headers }),
        fetch("/api/admin/tours", { headers }),
      ]);

      const leadsData = (await leadsRes.json()) as {
        error?: string;
        newsletter?: NewsletterRow[];
        contacts?: ContactRow[];
      };
      const shopData = (await shopRes.json()) as {
        error?: string;
        orders?: ShopOrderRow[];
      };
      const toursData = (await toursRes.json()) as {
        error?: string;
        tours?: TourContentRow[];
      };

      if (!leadsRes.ok) throw new Error(leadsData.error ?? "Не удалось загрузить лиды");
      if (!shopRes.ok) throw new Error(shopData.error ?? "Не удалось загрузить заказы");
      if (!toursRes.ok) throw new Error(toursData.error ?? "Не удалось загрузить туры");

      setNewsletter(leadsData.newsletter ?? []);
      setContacts(leadsData.contacts ?? []);
      setShopOrders(shopData.orders ?? []);
      setTourRows(toursData.tours ?? []);
      sessionStorage.setItem(TOKEN_KEY, authToken);
      setStoredToken(authToken);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY);
    if (saved) void load(saved);
  }, [load]);

  function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    if (!token.trim()) return;
    void load(token.trim());
  }

  function handleLogout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setStoredToken(null);
    setNewsletter([]);
    setContacts([]);
    setShopOrders([]);
    setTourRows([]);
  }

  if (!storedToken) {
    return (
      <div className="min-h-screen bg-surface-muted px-4 py-16">
        <div className={`mx-auto max-w-md ${cabinetPanelClass} p-8`}>
          <h1 className="font-heading text-2xl font-bold text-charcoal">Вход: админ</h1>
          <p className="mt-2 text-sm text-slate">
            Токен из переменной <code className="text-xs">LEADS_ADMIN_TOKEN</code> на сервере.
          </p>
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <Input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Admin token"
              autoComplete="current-password"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Проверка…" : "Войти"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate">
            <Link href="/" className="text-sky hover:underline">
              На главную
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-charcoal">Админ</h1>
            <p className="mt-1 text-sm text-slate">Лиды, заказы магазина и туры из Supabase</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void load(storedToken)} disabled={loading}>
              Обновить
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              Выйти
            </Button>
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeTab === "leads" ? "default" : "outline"}
            onClick={() => setActiveTab("leads")}
          >
            Лиды
          </Button>
          <Button
            variant={activeTab === "shop" ? "default" : "outline"}
            onClick={() => setActiveTab("shop")}
          >
            Магазин ({shopOrders.length})
          </Button>
          <Button
            variant={activeTab === "tours" ? "default" : "outline"}
            onClick={() => setActiveTab("tours")}
          >
            Туры ({tourRows.length})
          </Button>
        </div>

        {activeTab === "leads" ? (
          <>
            <section className={`${cabinetCardClass} overflow-hidden`}>
              <h2 className="border-b border-gray-100 px-5 py-4 font-heading text-lg font-bold text-charcoal">
                Подписки ({newsletter.length})
              </h2>
              <ul className="divide-y divide-gray-100">
                {newsletter.length === 0 ? (
                  <li className="px-5 py-8 text-sm text-slate">Пока пусто</li>
                ) : (
                  newsletter.map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
                    >
                      <span className="font-medium text-charcoal">{row.email}</span>
                      <span className="text-slate">
                        {row.source} · {formatWhen(row.created_at)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className={`${cabinetCardClass} overflow-hidden`}>
              <h2 className="border-b border-gray-100 px-5 py-4 font-heading text-lg font-bold text-charcoal">
                Заявки ({contacts.length})
              </h2>
              <ul className="divide-y divide-gray-100">
                {contacts.length === 0 ? (
                  <li className="px-5 py-8 text-sm text-slate">Пока пусто</li>
                ) : (
                  contacts.map((row) => (
                    <li key={row.id} className="space-y-1 px-5 py-4 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-sky/10 px-2 py-0.5 text-xs font-medium text-sky">
                          {row.kind}
                        </span>
                        <span className="font-medium text-charcoal">{row.name}</span>
                        <span className="text-slate">{formatWhen(row.created_at)}</span>
                      </div>
                      <p className="text-slate">
                        {[row.email, row.phone].filter(Boolean).join(" · ") || "—"}
                      </p>
                      {row.message ? <p className="text-charcoal">{row.message}</p> : null}
                    </li>
                  ))
                )}
              </ul>
            </section>
          </>
        ) : activeTab === "shop" ? (
          <section className={`${cabinetCardClass} overflow-hidden`}>
            <h2 className="border-b border-gray-100 px-5 py-4 font-heading text-lg font-bold text-charcoal">
              Заказы магазина ({shopOrders.length})
            </h2>
            <ul className="divide-y divide-gray-100">
              {shopOrders.length === 0 ? (
                <li className="px-5 py-8 text-sm text-slate">Пока пусто</li>
              ) : (
                shopOrders.map((row) => (
                  <li key={row.id} className="space-y-1 px-5 py-4 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-charcoal">{row.productTitle}</span>
                      <span className="rounded-full bg-sky/10 px-2 py-0.5 text-xs font-medium text-sky">
                        {shopStatusLabel(row.status)}
                      </span>
                      <span className="text-slate">{formatWhen(row.createdAt)}</span>
                    </div>
                    <p className="text-slate">
                      {row.id} · ${row.priceUsd} {row.currency}
                    </p>
                    <p className="text-charcoal">
                      {row.customerName} · {row.customerEmail}
                      {row.customerPhone ? ` · ${row.customerPhone}` : ""}
                    </p>
                    {row.notes ? <p className="text-slate">{row.notes}</p> : null}
                    {row.deliveryUrl ? (
                      <a
                        href={row.deliveryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky hover:underline"
                      >
                        delivery_url
                      </a>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </section>
        ) : (
          <section className={`${cabinetCardClass} overflow-hidden`}>
            <h2 className="border-b border-gray-100 px-5 py-4 font-heading text-lg font-bold text-charcoal">
              Туры в Supabase ({tourRows.length})
            </h2>
            <ul className="divide-y divide-gray-100">
              {tourRows.length === 0 ? (
                <li className="px-5 py-8 text-sm text-slate">Пока пусто</li>
              ) : (
                tourRows.map((row) => (
                  <li key={row.id} className="space-y-1 px-5 py-4 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-charcoal">{row.title}</span>
                      <span className="rounded-full bg-sky/10 px-2 py-0.5 text-xs font-medium text-sky">
                        {row.status}
                      </span>
                      <span className="text-slate">{formatWhen(row.updatedAt)}</span>
                    </div>
                    <p className="text-slate">
                      {row.slug} · {row.ownerUserId}
                    </p>
                    <Link href={`/tours/${row.slug}`} className="text-sky hover:underline">
                      Открыть на сайте
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
