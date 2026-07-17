"use client";

import { useEffect, useState } from "react";
import Hero from "@/components/Hero";
import ShopProductCard from "@/components/shop/ShopProductCard";
import { Button } from "@/components/ui/button";
import { isSupabaseShopEnabled } from "@/lib/auth-mode";
import { siteContainerClass } from "@/lib/site-container";
import type { SiteCommerceGlobal } from "@/types/site-globals";
import type { ShopProduct } from "@/types/shop-product";

export default function ShopPageView({
  settings,
  heroImage,
  catalog,
}: {
  settings: SiteCommerceGlobal;
  heroImage: string;
  catalog: ShopProduct[];
}) {
  const shopCheckoutEnabled = isSupabaseShopEnabled();
  const pageSize = Number(settings.catalogPageSize);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const catalogColumns = {
    "2": "lg:grid-cols-2",
    "3": "lg:grid-cols-3",
    "4": "lg:grid-cols-4",
  }[settings.catalogColumns];
  const products = catalog.slice(0, visibleCount);
  const hasMore = visibleCount < catalog.length;
  const isPaginated = catalog.length > pageSize;
  const nextPageSize = Math.min(pageSize, catalog.length - visibleCount);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [pageSize]);

  return (
    <>
      <Hero
        title="Магазин гидов"
        subtitle="PDF-путеводители и списки для самостоятельной подготовки к поездке"
        image={heroImage}
        compact
      />

      <section className={siteContainerClass + " py-12 sm:py-16"}>
        {settings.showCatalogIntro ? <div className="max-w-2xl">
          <p className="text-base leading-relaxed text-slate">
            {shopCheckoutEnabled
              ? "Электронные материалы от редакции платформы. Оформите заказ на сайте — менеджер свяжется для оплаты и отправит PDF на email."
              : "Электронные материалы от редакции платформы. Оплата и доставка на email — через заявку менеджеру."}
          </p>
        </div> : null}

        <div
          id="shop-product-grid"
          className={`mt-10 grid gap-5 sm:grid-cols-2 ${catalogColumns}`}
        >
          {products.length ? products.map((product) => (
            <ShopProductCard key={product.id} product={product} settings={settings} />
          )) : <p className="col-span-full rounded-2xl bg-surface-muted p-6 text-sm text-slate">Сейчас в магазине нет опубликованных товаров.</p>}
        </div>

        {isPaginated ? (
          <div className="mt-8 flex flex-col items-center gap-2 text-center">
            {hasMore ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-full px-8"
                aria-controls="shop-product-grid"
                onClick={() =>
                  setVisibleCount((count) => Math.min(count + pageSize, catalog.length))
                }
              >
                Показать ещё {nextPageSize}
              </Button>
            ) : null}
            <p className="text-xs text-slate" role="status" aria-live="polite">
              Показано {products.length} из {catalog.length}
            </p>
          </div>
        ) : null}

        <p className="mt-10 text-sm text-slate">
          {shopCheckoutEnabled
            ? "После заказа менеджер пришлёт ссылку или счёт и уточнит способ получения файла."
            : "После заявки менеджер свяжется с вами для оплаты и отправки файла на email."}
        </p>
      </section>
    </>
  );
}
