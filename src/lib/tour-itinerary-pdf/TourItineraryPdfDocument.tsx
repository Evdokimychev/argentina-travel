import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { formatDurationShort } from "@/lib/pluralize";
import { pdfStyles } from "@/lib/tour-itinerary-pdf/pdf-styles";
import { formatPdfGeneratedDate } from "@/lib/tour-itinerary-pdf/pdf-meta";
import type { TourItineraryPdfMeta, TourItineraryPdfSource } from "@/lib/tour-itinerary-pdf/types";

function resolvePdfImageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://goargentina.ru";
    return `${origin}${url}`;
  }
  return url;
}

function formatTourPrice(source: TourItineraryPdfSource): string {
  if (source.priceOnRequest) return "Цена по запросу";
  const prefix = source.priceFromPrefix ? "от " : "";
  const formatted = new Intl.NumberFormat("ru-RU").format(Math.round(source.priceUsd));
  return `${prefix}$${formatted} USD`;
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <View style={pdfStyles.bulletList}>
      {items.map((item) => (
        <View key={item} style={pdfStyles.bulletItem}>
          <Text style={pdfStyles.bulletDot}>•</Text>
          <Text style={pdfStyles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function PageFooter({ meta }: { meta: TourItineraryPdfMeta }) {
  return (
    <View fixed style={pdfStyles.footer}>
      <View style={pdfStyles.footerLeft}>
        <Text style={pdfStyles.footerBrand}>
          {meta.brandName} · {meta.brandDomain}
        </Text>
        <Text style={pdfStyles.footerNote}>
          Официальная программа тура. Актуальные даты и цены — на сайте.
        </Text>
      </View>
      <View>
        <Text style={pdfStyles.footerRight}>ID: {meta.documentId}</Text>
        <Text style={pdfStyles.footerRight}>{meta.tourUrl}</Text>
      </View>
    </View>
  );
}

interface TourItineraryPdfDocumentProps {
  source: TourItineraryPdfSource;
  meta: TourItineraryPdfMeta;
}

export function TourItineraryPdfDocument({ source, meta }: TourItineraryPdfDocumentProps) {
  const heroImage = resolvePdfImageUrl(source.image);
  const durationLabel = formatDurationShort(source.durationDays, source.durationNights);
  const groupLabel = `${source.groupMin}–${source.groupMax} туристов`;

  return (
    <Document
      title={`${source.title} — программа тура`}
      author={meta.brandName}
      subject="Программа тура"
      creator={`${meta.brandName} (${meta.brandDomain})`}
      keywords={`${source.region}, ${source.title}, тур, Аргентина`}
    >
      <Page size="A4" style={pdfStyles.page} wrap>
        <Text fixed style={pdfStyles.watermark}>
          {meta.brandDomain}
        </Text>
        <PageFooter meta={meta} />

        <View style={pdfStyles.headerBar}>
          <View>
            <Text style={pdfStyles.brandName}>{meta.brandName}</Text>
            <Text style={pdfStyles.brandDomain}>{meta.brandDomain}</Text>
          </View>
          <View style={pdfStyles.securityBadge}>
            <Text style={pdfStyles.securityBadgeTitle}>Проверенная программа</Text>
            <Text style={pdfStyles.securityBadgeText}>Документ сформирован на платформе</Text>
          </View>
        </View>

        {heroImage ? <Image style={pdfStyles.heroImage} src={heroImage} /> : null}

        <Text style={pdfStyles.title}>{source.title}</Text>
        <Text style={pdfStyles.subtitle}>
          {source.region}, {source.country} · {durationLabel}
        </Text>

        <View style={pdfStyles.factsRow}>
          <View style={pdfStyles.factPill}>
            <Text style={pdfStyles.factLabel}>Стоимость</Text>
            <Text style={pdfStyles.factValue}>{formatTourPrice(source)}</Text>
          </View>
          <View style={pdfStyles.factPill}>
            <Text style={pdfStyles.factLabel}>Группа</Text>
            <Text style={pdfStyles.factValue}>{groupLabel}</Text>
          </View>
          <View style={pdfStyles.factPill}>
            <Text style={pdfStyles.factLabel}>Сложность</Text>
            <Text style={pdfStyles.factValue}>{source.difficulty}</Text>
          </View>
          <View style={pdfStyles.factPill}>
            <Text style={pdfStyles.factLabel}>Комфорт</Text>
            <Text style={pdfStyles.factValue}>{source.comfort}</Text>
          </View>
        </View>

        <View style={pdfStyles.docMetaBox}>
          <Text style={pdfStyles.docMetaLine}>ID документа: {meta.documentId}</Text>
          <Text style={pdfStyles.docMetaLine}>
            Сформирован: {formatPdfGeneratedDate(meta.generatedAt)}
          </Text>
          <Text style={pdfStyles.docMetaLine}>Страница тура: {meta.tourUrl}</Text>
          <Text style={pdfStyles.docMetaLine}>Организатор: {source.organizer.name}</Text>
        </View>

        <Text style={pdfStyles.sectionTitle}>О туре</Text>
        <Text style={pdfStyles.paragraph}>{source.shortDescription}</Text>
        {source.startLocation ? (
          <Text style={pdfStyles.paragraph}>Место начала: {source.startLocation}</Text>
        ) : null}

        {source.places.length > 0 ? (
          <>
            <Text style={pdfStyles.sectionTitle}>Ключевые места</Text>
            {source.places.slice(0, 4).map((place) => (
              <View key={place.title} style={pdfStyles.placeCard}>
                <Text style={pdfStyles.placeTitle}>{place.title}</Text>
                <Text style={pdfStyles.placeDescription}>{place.description}</Text>
              </View>
            ))}
          </>
        ) : null}

        <Text style={pdfStyles.sectionTitle}>Программа по дням</Text>
        {source.itinerary.map((day) => {
          const dayImages = (day.images ?? []).slice(0, 2).map(resolvePdfImageUrl).filter(Boolean);
          return (
            <View key={day.id} style={pdfStyles.dayCard} wrap={false}>
              <View style={pdfStyles.dayHeader}>
                <Text style={pdfStyles.dayNumber}>{day.dayNumber}</Text>
                <Text style={pdfStyles.dayTitle}>
                  День {day.dayNumber}. {day.title}
                </Text>
              </View>
              <View style={pdfStyles.dayBody}>
                <Text style={pdfStyles.paragraph}>{day.description}</Text>
                {dayImages.length > 0 ? (
                  <View style={pdfStyles.dayImagesRow}>
                    {dayImages.map((img) => (
                      <Image key={img} style={pdfStyles.dayImage} src={img} />
                    ))}
                  </View>
                ) : null}
                <View style={pdfStyles.dayMetaGrid}>
                  {day.activities?.length ? (
                    <View style={pdfStyles.dayMetaBox}>
                      <Text style={pdfStyles.dayMetaLabel}>Активности</Text>
                      <Text style={pdfStyles.dayMetaText}>{day.activities.join(" · ")}</Text>
                    </View>
                  ) : null}
                  {day.meals?.length ? (
                    <View style={pdfStyles.dayMetaBox}>
                      <Text style={pdfStyles.dayMetaLabel}>Питание</Text>
                      <Text style={pdfStyles.dayMetaText}>{day.meals.join(" · ")}</Text>
                    </View>
                  ) : null}
                  {day.accommodation ? (
                    <View style={pdfStyles.dayMetaBox}>
                      <Text style={pdfStyles.dayMetaLabel}>Проживание</Text>
                      <Text style={pdfStyles.dayMetaText}>{day.accommodation}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          );
        })}

        <View style={pdfStyles.twoColumns}>
          <View style={pdfStyles.column}>
            <Text style={pdfStyles.sectionTitle}>Включено</Text>
            <BulletList items={source.included} />
          </View>
          <View style={pdfStyles.column}>
            <Text style={pdfStyles.sectionTitle}>Не включено</Text>
            <BulletList items={source.excluded} />
          </View>
        </View>

        {(source.arrival?.meetingPoint ||
          source.arrival?.airports?.length ||
          source.arrival?.transfers?.length) && (
          <>
            <Text style={pdfStyles.sectionTitle}>Прибытие и трансфер</Text>
            {source.arrival.meetingPoint ? (
              <Text style={pdfStyles.paragraph}>Место встречи: {source.arrival.meetingPoint}</Text>
            ) : null}
            {source.arrival.airports?.length ? (
              <Text style={pdfStyles.paragraph}>
                Аэропорты: {source.arrival.airports.join(", ")}
              </Text>
            ) : null}
            {source.arrival.transfers?.length ? (
              <BulletList items={source.arrival.transfers} />
            ) : null}
          </>
        )}

        {source.importantInfo.length > 0 ? (
          <>
            <Text style={pdfStyles.sectionTitle}>Важно знать</Text>
            <BulletList items={source.importantInfo} />
          </>
        ) : null}

        <Text style={pdfStyles.disclaimer}>
          Документ носит информационный характер. Даты заездов, цены и наличие мест уточняйте на{" "}
          {meta.brandDomain} перед бронированием. Перепродажа и изменение без согласия организатора
          запрещены. Контакты организатора: {source.organizer.name}
          {source.organizer.phone ? ` · ${source.organizer.phone}` : ""}
          {source.organizer.email ? ` · ${source.organizer.email}` : ""}.
        </Text>
      </Page>
    </Document>
  );
}
