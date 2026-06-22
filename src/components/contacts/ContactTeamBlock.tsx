import { Users } from "lucide-react";
import ContactTeamStatus from "@/components/contacts/ContactTeamStatus";
import { SITE_WORKING_HOURS } from "@/data/site-contacts";

export default function ContactTeamBlock() {
  return (
    <section
      className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-sky/[0.04] p-6 shadow-card sm:p-8"
      aria-labelledby="contact-team-heading"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky/10 text-sky">
          <Users className="h-6 w-6" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 id="contact-team-heading" className="font-heading text-xl font-bold text-charcoal">
            Команда на связи
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate">
            Редакция путеводителя и менеджеры туров отвечают из Буэнос-Айреса и Москвы. Пишите по
            бронированию, маршрутам и иммиграционным вопросам — мы не оказываем юридических услуг.
          </p>
          <ContactTeamStatus />
          <p className="mt-3 text-xs text-slate/80">{SITE_WORKING_HOURS}</p>
        </div>
      </div>
    </section>
  );
}
