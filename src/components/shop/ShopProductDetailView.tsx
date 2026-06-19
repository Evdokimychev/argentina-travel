"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, FileText, MessageCircle, ShoppingBag } from "lucide-react";
import type { ShopProduct } from "@/data/shop-products";
import { isSupabaseShopEnabled } from "@/lib/auth-mode";
import { siteContainerClass } from "@/lib/site-container";
import ShopCheckoutModal from "@/components/shop/ShopCheckoutModal";

interface ShopProductDetailViewProps {
  product: ShopProduct;
}

export default function ShopProductDetailView({ product }: ShopProductDetailViewProps) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const shopCheckoutEnabled = isSupabaseShopEnabled();

  return (
    <>
      <section className={siteContainerClass + " py-10 sm:py-14"}>
        <Link
          href="/shop"
          className="inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Все гиды
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-card">
            <Image
              src={product.image}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-charcoal">
              <FileText className="h-4 w-4" aria-hidden />
              {product.format}
            </span>
          </div>

          <div>
            <h1 className="font-heading text-3xl font-bold text-charcoal sm:text-4xl">
              {product.title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate">{product.description}</p>
            <p className="mt-6 font-heading text-3xl font-bold text-charcoal">
              ${product.price}{" "}
              <span className="text-lg font-normal text-slate">{product.currency}</span>
            </p>

            <p className="mt-4 text-sm leading-relaxed text-slate">
              {shopCheckoutEnabled
                ? "Оформите заказ — менеджер пришлёт ссылку на оплату и отправит PDF после подтверждения."
                : "Отправьте заявку — менеджер свяжется для оплаты и доставки файла на email."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {shopCheckoutEnabled ? (
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-sky px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-sky/90"
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden />
                  Купить
                </button>
              ) : (
                <Link
                  href={`/contacts?product=${product.slug}`}
                  className="inline-flex items-center gap-2 rounded-full bg-sky px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-sky/90"
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden />
                  Запросить
                </Link>
              )}
              <Link
                href={`/contacts?product=${product.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-charcoal transition-colors hover:border-sky/40 hover:text-sky"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Задать вопрос
              </Link>
            </div>
          </div>
        </div>
      </section>

      {shopCheckoutEnabled ? (
        <ShopCheckoutModal
          product={product}
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
        />
      ) : null}
    </>
  );
}