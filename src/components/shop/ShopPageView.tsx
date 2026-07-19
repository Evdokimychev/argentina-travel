"use client";

import { useEffect, useState } from "react";
import Hero from "@/components/Hero";
import ShopProductCard from "@/components/shop/ShopProductCard";
import { Button } from "@/components/ui/button";
import { SHOP_PRODUCTS } from "@/data/shop-products";
import { getServicePageHeroImage } from "@/lib/media-resolver";
import { isSupabaseShopEnabled } from "@/lib/auth-mode";
import { siteContainerClass } from "@/lib/site-container";
import type { SiteCommerceGlobal } from "@/types/site-globals";

export default function ShopPageView({ settings }: { settings: SiteCommerceGlobal }) {
  const shopCheckoutEnabled = isSupabaseShopEnabled();
  const pageSize = Number(settings.catalogPageSize);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const catalogColumns = {
    "2": "lg:grid-cols-2",
    "3": "lg:grid-cols-3",
    "4": "lg:grid-cols-4",
  }[settings.catalogColumns];
  const products = SHOP_PRODUCTS.slice(0, visibleCount);
  const hasMore = visibleCount < SHOP_PRODUCTS.length;
  const isPaginated = SHOP_PRODUCTS.length > pageSize;
  const nextPageSize = Math.min(pageSize, SHOP_PRODUCTS.length - visibleCount);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [pageSize]);

  return (
    <>
      <Hero
        title="Магазин гидов"
        subtitle="PDF-путеводители и списки для самостоятельной подготовки к поездке"
        image={getServicePageHeroImage("shop")}
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
          {products.map((product) => (
            <ShopProductCard key={product.id} product={product} settings={settings} />
          ))}
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
                  setVisibleCount((count) => Math.min(count + pageSize, SHOP_PRODUCTS.length))
                }
              >
                Показать ещё {nextPageSize}
              </Button>
            ) : null}
            <p className="text-xs text-slate" role="status" aria-live="polite">
              Показано {products.length} из {SHOP_PRODUCTS.length}
            </p>
          </div>
        ) : null}

        <p className="mt-10 text-sm text-slate">
          {shopCheckoutEnabled
            ? "Автоматическая оплата на сайте появится позже — сейчас менеджер высылает ссылку или счёт вручную."
            : "После заявки менеджер свяжется с вами для оплаты и отправки файла на email."}
        </p>
      </section>
    </>
  );
}
