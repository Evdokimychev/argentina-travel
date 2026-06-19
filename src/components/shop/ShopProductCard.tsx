"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FileText, MessageCircle, ShoppingBag } from "lucide-react";
import type { ShopProduct } from "@/data/shop-products";
import { isSupabaseShopEnabled } from "@/lib/auth-mode";
import ShopCheckoutModal from "@/components/shop/ShopCheckoutModal";

interface ShopProductCardProps {
  product: ShopProduct;
}

export default function ShopProductCard({ product }: ShopProductCardProps) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const shopCheckoutEnabled = isSupabaseShopEnabled();

  return (
    <>
      <article className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
        <Link href={`/shop/${product.slug}`} className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={product.image}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-charcoal">
            <FileText className="h-3 w-3" aria-hidden />
            {product.format}
          </span>
        </Link>
        <div className="flex flex-1 flex-col p-5">
          <Link
            href={`/shop/${product.slug}`}
            className="font-heading text-lg font-bold text-charcoal transition-colors hover:text-sky"
          >
            {product.title}
          </Link>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-slate">{product.description}</p>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <span className="font-heading text-xl font-bold text-charcoal">
              ${product.price}{" "}
              <span className="text-sm font-normal text-slate">{product.currency}</span>
            </span>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Link
                href={`/contacts?product=${product.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-2 text-sm font-medium text-charcoal transition-colors hover:border-sky/40 hover:text-sky"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Вопрос
              </Link>
              {shopCheckoutEnabled ? (
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-sky px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky/90"
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden />
                  Купить
                </button>
              ) : (
                <Link
                  href={`/contacts?product=${product.slug}`}
                  className="inline-flex items-center gap-2 rounded-full bg-sky px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky/90"
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden />
                  Запросить
                </Link>
              )}
            </div>
          </div>
        </div>
      </article>

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
