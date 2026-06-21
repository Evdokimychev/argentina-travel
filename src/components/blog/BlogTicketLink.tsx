import { ExternalLink } from "lucide-react";

type BlogTicketLinkProps = {
  url: string;
  label: string;
};

export default function BlogTicketLink({ url, label }: BlogTicketLinkProps) {
  return (
    <div className="rounded-2xl border border-sky/20 bg-gradient-to-br from-sky/[0.06] to-white p-4 shadow-sm sm:p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate/80">
        Официальная продажа билетов
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 sm:w-auto"
      >
        {label}
        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
      </a>
    </div>
  );
}
