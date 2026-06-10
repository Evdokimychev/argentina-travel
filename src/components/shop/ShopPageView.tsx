import Image from "next/image";
import Link from "next/link";
import { FileText, ShoppingBag } from "lucide-react";
import Hero from "@/components/Hero";
import { SHOP_PRODUCTS } from "@/data/shop-products";
import { siteContainerClass } from "@/lib/site-container";

export default function ShopPageView() {
  return (
    <>
      <Hero
        title="Магазин гидов"
        subtitle="PDF-путеводители и чеклисты для самостоятельной подготовки к поездке"
        image="https://images.unsplash.com/photo-1483728642387-6bc3bd38dafc?w=1920&q=80"
        compact
      />

      <section className={siteContainerClass + " py-12 sm:py-16"}>
        <div className="max-w-2xl">
          <p className="text-base leading-relaxed text-slate">
            Электронные материалы от редакции платформы. Оплата и доставка на email — через заявку
            менеджеру: без автоматического checkout на сайте.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SHOP_PRODUCTS.map((product) => (
            <article
              key={product.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-charcoal">
                  <FileText className="h-3 w-3" aria-hidden />
                  {product.format}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="font-display text-lg font-bold text-charcoal">{product.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate">
                  {product.description}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                  <span className="font-display text-xl font-bold text-charcoal">
                    ${product.price}{" "}
                    <span className="text-sm font-normal text-slate">{product.currency}</span>
                  </span>
                  <Link
                    href={`/contacts?product=${product.slug}`}
                    className="inline-flex items-center gap-2 rounded-full bg-sky px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky/90"
                  >
                    <ShoppingBag className="h-4 w-4" aria-hidden />
                    Запросить
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-sm text-slate">
          После заявки менеджер свяжется с вами для оплаты и отправки файла на email. Полноценная
          оплата на сайте появится позже — архитектура готова для digital delivery.
        </p>
      </section>
    </>
  );
}
