import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-heading text-6xl font-bold text-sky">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-charcoal">
        Страница не найдена
      </h1>
      <p className="mt-2 max-w-md text-slate">
        Возможно, страница была удалена или адрес введён неверно. Попробуйте вернуться в
        каталог — там актуальные туры и экскурсии.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/tours" className={cn(buttonVariants(), "rounded-full px-8")}>
          Каталог туров
        </Link>
        <Link href="/excursions" className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-8")}>
          Экскурсии
        </Link>
        <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "rounded-full px-6")}>
          На главную
        </Link>
      </div>
    </div>
  );
}
