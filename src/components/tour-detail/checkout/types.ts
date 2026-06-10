import type { TransferAllocations } from "./checkout-transfer";
import { EMPTY_TRANSFER_ALLOCATIONS } from "./checkout-transfer";

export type RoomOptionId =
  | "single"
  | "twin"
  | "double"
  | "triple"
  | "upgrade4"
  | "upgrade5";

export interface RoomOption {
  id: RoomOptionId;
  title: string;
  description: string;
  priceUsdPerTraveler: number;
  /** Сколько туристов размещается в одном номере этого типа */
  capacity: number;
}

export const CHECKOUT_ROOM_OPTIONS: RoomOption[] = [
  {
    id: "single",
    title: "Одноместный номер",
    description: "Уютный номер для одного гостя — удобно для путешествия в одиночку.",
    priceUsdPerTraveler: 180,
    capacity: 1,
  },
  {
    id: "twin",
    title: "Номер с двумя кроватями",
    description: "Две отдельные кровати — для друзей или коллег, которые путешествуют вместе.",
    priceUsdPerTraveler: 0,
    capacity: 2,
  },
  {
    id: "double",
    title: "Двухместный номер",
    description: "Одна двуспальная кровать — стандартное размещение по программе тура.",
    priceUsdPerTraveler: 0,
    capacity: 2,
  },
  {
    id: "triple",
    title: "Трёхместный номер",
    description: "Просторный номер на троих — подходит для небольших групп или семей.",
    priceUsdPerTraveler: 0,
    capacity: 3,
  },
  {
    id: "upgrade4",
    title: "Категория 4★",
    description: "Номер категории 4★ с двуспальной или двумя раздельными кроватями.",
    priceUsdPerTraveler: 120,
    capacity: 2,
  },
  {
    id: "upgrade5",
    title: "Категория 5★",
    description: "Номер повышенной категории 5★ с двуспальной или двумя раздельными кроватями.",
    priceUsdPerTraveler: 250,
    capacity: 2,
  },
];

export type RoomAllocations = Record<RoomOptionId, number>;

export type { TransferAllocations };

import type { BookingCheckoutPaymentOption } from "@/types/booking-params";

export type PaymentOption = BookingCheckoutPaymentOption;

export const CHECKOUT_PAYMENT_OPTIONS: Array<{ id: PaymentOption; label: string }> = [
  { id: "full", label: "Полная оплата" },
  { id: "deposit", label: "Депозит 10%" },
  { id: "later", label: "Оплатить позже" },
];

export interface TravelerForm {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
}

export function createEmptyTraveler(): TravelerForm {
  return { firstName: "", lastName: "", dateOfBirth: null };
}

export interface CheckoutFormState {
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
  contactDateOfBirth: Date | null;
  contactIsParticipant1: boolean;
  createAccount: boolean;
  travelers: TravelerForm[];
  fillTravelersLater: boolean;
  roomAllocations: RoomAllocations;
  addonIds: string[];
  insuranceTravelers: number;
  transferAllocations: TransferAllocations;
  comments: string;
  paymentOption: PaymentOption;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  coupon: string;
}

export function createInitialCheckoutForm(guests: number): CheckoutFormState {
  return {
    contactFirstName: "",
    contactLastName: "",
    contactEmail: "",
    contactPhone: "",
    contactDateOfBirth: null,
    contactIsParticipant1: false,
    createAccount: true,
    travelers: Array.from({ length: guests }, () => createEmptyTraveler()),
    fillTravelersLater: false,
    roomAllocations: {
      single: 0,
      twin: 0,
      double: guests,
      triple: 0,
      upgrade4: 0,
      upgrade5: 0,
    },
    addonIds: [],
    insuranceTravelers: 0,
    transferAllocations: { ...EMPTY_TRANSFER_ALLOCATIONS },
    comments: "",
    paymentOption: "later",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    coupon: "",
  };
}

export const CHECKOUT_STEPS = [
  { id: "travelers", label: "Туристы" },
  { id: "accommodation", label: "Проживание" },
  { id: "addons", label: "Дополнения" },
  { id: "details", label: "Данные" },
  { id: "payment", label: "Оплата" },
] as const;

export type CheckoutStepId = (typeof CHECKOUT_STEPS)[number]["id"];
