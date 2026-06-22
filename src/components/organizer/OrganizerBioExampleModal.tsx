"use client";

import Image from "next/image";
import { BadgeCheck, CircleHelp, Phone, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const EXAMPLE_AUTHOR = {
  name: "Ирина Б.",
  title: "автор тура",
  avatar:
    "",
  paragraphs: [
    "Организую туры с 2007 года. Мой выбор — Аргентина: здесь сочетаются океан, горы, виноградники и живая культура, которую хочется показывать снова и снова. Я сама много путешествую по стране и делюсь только проверенными маршрутами.",
    "Наша команда создаёт и проводит авторские туры по Буэнос-Айресу, Патагонии, Мендосе и северу Аргентины — туда, где остаётся часть сердца. Рассказываю о местах честно, без рекламных штампов, и всегда на связи с путешественниками до и после поездки.",
  ],
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

interface OrganizerBioExampleModalProps {
  open: boolean;
  onClose: () => void;
}

export default function OrganizerBioExampleModal({
  open,
  onClose,
}: OrganizerBioExampleModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="flex max-h-[90vh] max-w-lg animate-fade-in-up flex-col overflow-hidden p-0"
        onPointerDownOutside={onClose}
        onEscapeKeyDown={onClose}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <DialogTitle className="text-lg sm:text-xl">
            Пример хорошего описания автора
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 text-slate transition-colors hover:bg-gray-100 hover:text-charcoal"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h4 className="font-heading text-xl font-bold leading-tight text-charcoal sm:text-2xl">
                {EXAMPLE_AUTHOR.name} — {EXAMPLE_AUTHOR.title}
              </h4>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-slate">
                <BadgeCheck className="h-4 w-4 shrink-0 text-sky" strokeWidth={2} />
                <span>Личность подтверждена</span>
                <CircleHelp className="h-4 w-4 shrink-0 text-gray-300" strokeWidth={1.75} />
              </div>
            </div>

            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full sm:h-20 sm:w-20">
              <Image
                src={EXAMPLE_AUTHOR.avatar}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          </div>

          <div className="mt-5 space-y-4 text-sm leading-relaxed text-charcoal sm:text-[15px]">
            {EXAMPLE_AUTHOR.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-charcoal">
              <Phone className="h-4 w-4 shrink-0 text-slate" strokeWidth={1.75} />
              Позвонить
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-charcoal">
              <WhatsAppIcon className="h-4 w-4 shrink-0 text-[#25D366]" />
              Написать
            </div>
          </div>

          <p className="mt-5 text-xs leading-relaxed text-slate">
            Так описание автора выглядит на странице тура. Пишите о себе живым языком, без
            контактов и ссылок — туристы свяжутся с вами через площадку.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
