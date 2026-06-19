import { Lock } from "lucide-react";

export default function PrivateTourBanner() {
  return (
    <div className="rounded-2xl border border-charcoal/15 bg-charcoal/[0.04] px-4 py-3 sm:px-5 sm:py-4">
      <p className="flex items-start gap-2 text-sm leading-relaxed text-charcoal">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-charcoal" aria-hidden />
        <span>
          <span className="font-semibold">Приватное предложение.</span> Этот тур скрыт из каталога и
          доступен только по персональной ссылке от организатора.
        </span>
      </p>
    </div>
  );
}
