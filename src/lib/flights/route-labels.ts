import { t } from "@/lib/i18n";
import type { LocaleCode } from "@/types/locale";
import en from "@/locales/en/common.json";
import es from "@/locales/es/common.json";
import pt from "@/locales/pt/common.json";
import ru from "@/locales/ru/common.json";

const MESSAGE_BY_LOCALE = { ru, en, es, pt } as const;

export type FlightRouteLabels = {
  eyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  searchCta: string;
  relatedTitle: string;
  relatedSubtitle: string;
  faqTitle: string;
  faqIntro: string;
  noTeaserTitle: string;
  noTeaserBody: string;
  noTeaserCta: string;
  contactCta: string;
  calendarTitle: string;
  calendarSubtitle: string;
  calendarDisclaimer: string;
  calendarEmpty: string;
  calendarCheapest: string;
  calendarMonth: string;
  breadcrumbHome: string;
  breadcrumbFlights: string;
  immigrationTitle: string;
  immigrationSubtitle: string;
  getFaqItems: (originLabel: string, destinationLabel: string) => Array<{ question: string; answer: string }>;
  getRouteIntro: (routeId: string, originLabel: string, destinationLabel: string) => string;
};

function interpolate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template
  );
}

export function getFlightRouteLabels(locale: LocaleCode = "ru"): FlightRouteLabels {
  const messages = MESSAGE_BY_LOCALE[locale] ?? ru;

  return {
    eyebrow: t(messages, "flights.route.eyebrow"),
    heroTitle: t(messages, "flights.route.heroTitle"),
    heroSubtitle: t(messages, "flights.route.heroSubtitle"),
    searchCta: t(messages, "flights.route.searchCta"),
    relatedTitle: t(messages, "flights.route.relatedTitle"),
    relatedSubtitle: t(messages, "flights.route.relatedSubtitle"),
    faqTitle: t(messages, "flights.route.faqTitle"),
    faqIntro: t(messages, "flights.route.faqIntro"),
    noTeaserTitle: t(messages, "flights.route.noTeaserTitle"),
    noTeaserBody: t(messages, "flights.route.noTeaserBody"),
    noTeaserCta: t(messages, "flights.route.noTeaserCta"),
    contactCta: t(messages, "flights.route.contactCta"),
    calendarTitle: t(messages, "flights.route.calendarTitle"),
    calendarSubtitle: t(messages, "flights.route.calendarSubtitle"),
    calendarDisclaimer: t(messages, "flights.route.calendarDisclaimer"),
    calendarEmpty: t(messages, "flights.route.calendarEmpty"),
    calendarCheapest: t(messages, "flights.route.calendarCheapest"),
    calendarMonth: t(messages, "flights.route.calendarMonth"),
    breadcrumbHome: t(messages, "flights.route.breadcrumb.home"),
    breadcrumbFlights: t(messages, "flights.route.breadcrumb.flights"),
    immigrationTitle: t(messages, "flights.route.immigration.title"),
    immigrationSubtitle: t(messages, "flights.route.immigration.subtitle"),
    getFaqItems: (originLabel, destinationLabel) => [
      {
        question: interpolate(t(messages, "flights.route.faq.price.q"), { origin: originLabel, destination: destinationLabel }),
        answer: t(messages, "flights.route.faq.price.a"),
      },
      {
        question: interpolate(t(messages, "flights.route.faq.booking.q"), { origin: originLabel, destination: destinationLabel }),
        answer: t(messages, "flights.route.faq.booking.a"),
      },
      {
        question: t(messages, "flights.route.faq.domestic.q"),
        answer: t(messages, "flights.route.faq.domestic.a"),
      },
    ],
    getRouteIntro: (routeId, originLabel, destinationLabel) => {
      const key = `flights.route.${routeId}.intro`;
      const specific = t(messages, key, "");
      if (specific && specific !== key) return specific;
      return interpolate(t(messages, "flights.route.defaultIntro"), {
        origin: originLabel,
        destination: destinationLabel,
      });
    },
  };
}
