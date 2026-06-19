import { t } from "@/lib/i18n";
import type { LocaleCode } from "@/types/locale";
import en from "@/locales/en/common.json";
import es from "@/locales/es/common.json";
import pt from "@/locales/pt/common.json";
import ru from "@/locales/ru/common.json";

const MESSAGE_BY_LOCALE = { ru, en, es, pt } as const;

export type FlightTeaserLabels = {
  hubTitle: string;
  fromDate: string;
  aviasalesNote: string;
  viewTickets: string;
  fullSearch: string;
  disclaimer: string;
  loading: string;
  unavailable: string;
  checkRoute: string;
  ticketsCta: string;
  destinationTitle: string;
  destinationIntro: string;
  compareFlights: string;
  tourTitle: string;
  tourSubtitle: string;
  guideLink: string;
  travelPrepEyebrow: string;
  travelPrepTitle: string;
  allServices: string;
  travelPrepFlights: string;
  travelPrepFlightsDesc: string;
  travelPrepTransfers: string;
  travelPrepTransfersDesc: string;
  travelPrepEsim: string;
  travelPrepEsimDesc: string;
  travelPrepFrom: string;
  travelPrepOpen: string;
};

export function getFlightTeaserLabels(locale: LocaleCode = "ru"): FlightTeaserLabels {
  const messages = MESSAGE_BY_LOCALE[locale] ?? ru;

  return {
    hubTitle: t(messages, "flights.teaser.hubTitle"),
    fromDate: t(messages, "flights.teaser.fromDate"),
    aviasalesNote: t(messages, "flights.teaser.aviasalesNote"),
    viewTickets: t(messages, "flights.teaser.viewTickets"),
    fullSearch: t(messages, "flights.teaser.fullSearch"),
    disclaimer: t(messages, "flights.teaser.disclaimer"),
    loading: t(messages, "flights.teaser.loading"),
    unavailable: t(messages, "flights.teaser.unavailable"),
    checkRoute: t(messages, "flights.teaser.checkRoute"),
    ticketsCta: t(messages, "flights.teaser.ticketsCta"),
    destinationTitle: t(messages, "flights.teaser.destinationTitle"),
    destinationIntro: t(messages, "flights.teaser.destinationIntro"),
    compareFlights: t(messages, "flights.teaser.compareFlights"),
    tourTitle: t(messages, "flights.teaser.tourTitle"),
    tourSubtitle: t(messages, "flights.teaser.tourSubtitle"),
    guideLink: t(messages, "flights.teaser.guideLink"),
    travelPrepEyebrow: t(messages, "flights.travelPrep.eyebrow"),
    travelPrepTitle: t(messages, "flights.travelPrep.title"),
    allServices: t(messages, "flights.travelPrep.allServices"),
    travelPrepFlights: t(messages, "flights.travelPrep.flights"),
    travelPrepFlightsDesc: t(messages, "flights.travelPrep.flightsDesc"),
    travelPrepTransfers: t(messages, "flights.travelPrep.transfers"),
    travelPrepTransfersDesc: t(messages, "flights.travelPrep.transfersDesc"),
    travelPrepEsim: t(messages, "flights.travelPrep.esim"),
    travelPrepEsimDesc: t(messages, "flights.travelPrep.esimDesc"),
    travelPrepFrom: t(messages, "flights.travelPrep.from"),
    travelPrepOpen: t(messages, "flights.travelPrep.open"),
  };
}
