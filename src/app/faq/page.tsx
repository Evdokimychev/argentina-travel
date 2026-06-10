import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Частые вопросы",
  description: "Ответы на популярные вопросы о бронировании туров, оплате и работе с организаторами.",
};

const FAQ_ITEMS = [
  {
    question: "Как забронировать тур?",
    answer:
      "Откройте карточку тура, выберите дату и количество участников, затем отправьте заявку через форму бронирования. Организатор подтвердит место и согласует оплату.",
  },
  {
    question: "Нужна ли регистрация?",
    answer:
      "Можно оформить заявку как гость — она сохранится по email. Аккаунт даёт доступ к истории, сообщениям и избранному.",
  },
  {
    question: "Как оплатить тур?",
    answer:
      "Способ оплаты зависит от тура: часть организаторов принимает предоплату позже, другие — депозит или полную сумму. Статус и ссылка на оплату отображаются в личном кабинете после подтверждения.",
  },
  {
    question: "Как связаться с организатором?",
    answer:
      "Используйте кнопку «Задать вопрос» на странице тура или раздел «Сообщения» в личном кабинете после оформления заявки.",
  },
  {
    question: "Что значит «Новый тур» или «Новый организатор»?",
    answer:
      "Это честный статус: у тура или организатора пока нет опубликованных отзывов. После поездок появятся рейтинг и отзывы участников.",
  },
  {
    question: "Как стать организатором?",
    answer:
      "Перейдите в раздел «Для организаторов», подключите роль в аккаунте и создайте первый тур в редакторе. Публикация доступна после прохождения чеклиста качества.",
  },
  {
    question: "Как отменить или перенести бронирование?",
    answer:
      "Условия указаны в карточке тура. Напишите организатору через сообщения — он предложит варианты согласно своей политике отмены.",
  },
];

export default function FaqPage() {
  return (
    <div className="bg-surface-muted pb-16">
      <div className={cn(siteContainerClass, "py-8 md:py-12")}>
        <div className="mx-auto max-w-3xl">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky/10 text-sky">
              <HelpCircle className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <div>
              <h1 className="font-display text-3xl font-bold text-charcoal md:text-4xl">
                Частые вопросы
              </h1>
              <p className="mt-2 text-slate">
                Ответы о бронировании, оплате и работе с организаторами на «Пора в Аргентину».
              </p>
            </div>
          </div>

          <dl className="mt-10 space-y-4">
            {FAQ_ITEMS.map((item) => (
              <div
                key={item.question}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <dt className="font-display text-base font-bold text-charcoal">{item.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate">{item.answer}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-slate">
            <p className="font-medium text-charcoal">Не нашли ответ?</p>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              <Link href="/contacts" className="font-medium text-sky hover:underline">
                Напишите нам
              </Link>
              {" "}или откройте раздел{" "}
              <Link href="/legal/booking" className="font-medium text-sky hover:underline">
                условия бронирования
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
