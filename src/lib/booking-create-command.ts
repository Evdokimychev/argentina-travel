import type { CheckoutCurrencyCode } from "@/lib/payments/checkout-currency";

export interface CreateBookingCommand {
  tourId: string;
  optionId?: string;
  startDate: string;
  travelers: {
    adults: number;
    children?: number;
  };
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  promoCode?: string;
  idempotencyKey: string;
  intent?: "booking" | "price_quote";
  selections?: {
    roomAllocations?: Record<string, number>;
    addonIds?: string[];
    transferAllocations?: Record<string, number>;
  };
  details?: {
    comment?: string;
    fillTravelersLater?: boolean;
    travelers?: Array<{
      firstName: string;
      lastName: string;
      dateOfBirth?: string;
    }>;
    displayCurrency?: CheckoutCurrencyCode;
  };
}

export function totalCommandTravelers(command: CreateBookingCommand): number {
  return command.travelers.adults + (command.travelers.children ?? 0);
}
