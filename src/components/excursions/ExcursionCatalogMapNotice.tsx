type ExcursionCatalogMapNoticeProps = {
  cityName?: string;
};

export default function ExcursionCatalogMapNotice({ cityName }: ExcursionCatalogMapNoticeProps) {
  return (
    <div
      className="mt-6 rounded-2xl border border-sky/15 bg-sky/5 px-4 py-4 text-sm leading-relaxed text-charcoal sm:px-5"
      role="status"
    >
      Интерактивная карта каталога — в разработке. Ниже — список экскурсий
      {cityName ? ` в ${cityName}` : ""} по текущим фильтрам.
    </div>
  );
}
