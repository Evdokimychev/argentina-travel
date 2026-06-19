import Hero from "@/components/Hero";
import ShopProductCard from "@/components/shop/ShopProductCard";
import { SHOP_PRODUCTS } from "@/data/shop-products";
import { isSupabaseShopEnabled } from "@/lib/auth-mode";
import { siteContainerClass } from "@/lib/site-container";

export default function ShopPageView() {
  const shopCheckoutEnabled = isSupabaseShopEnabled();

  return (
    <>
      <Hero
        title="Магазин гидов"
        subtitle="PDF-путеводители и списки для самостоятельной подготовки к поездке"
        image="https://images.unsplash.com/photo-1483728642387-6bc3bd38dafc?w=1920&q=80"
        compact
      />

      <section className={siteContainerClass + " py-12 sm:py-16"}>
        <div className="max-w-2xl">
          <p className="text-base leading-relaxed text-slate">
            {shopCheckoutEnabled
              ? "Электронные материалы от редакции платформы. Оформите заказ на сайте — менеджер свяжется для оплаты и отправит PDF на email."
              : "Электронные материалы от редакции платформы. Оплата и доставка на email — через заявку менеджеру."}
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SHOP_PRODUCTS.map((product) => (
            <ShopProductCard key={product.id} product={product} />
          ))}
        </div>

        <p className="mt-10 text-sm text-slate">
          {shopCheckoutEnabled
            ? "Автоматическая оплата на сайте появится позже — сейчас менеджер высылает ссылку или счёт вручную."
            : "После заявки менеджер свяжется с вами для оплаты и отправки файла на email."}
        </p>
      </section>
    </>
  );
}
