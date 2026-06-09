export interface OrganizerCancellationPenalty {
  amount: string;
  period: string;
}

export type OrganizerCancellationPolicyType = "standard" | "individual";

export interface OrganizerCancellationSettings {
  policyType: OrganizerCancellationPolicyType;
  penalties: OrganizerCancellationPenalty[];
  additionalConditions: string;
}

export interface OrganizerContactsSettings {
  website: string;
  contactEmail: string;
  documentsEmail: string;
  additionalContacts: string;
  vkUrl: string;
  telegramUrl: string;
  otherSocialUrl: string;
  reviewUrls: string[];
  timezone: string;
  weekdayStart: string;
  weekdayEnd: string;
  weekendStart: string;
  weekendEnd: string;
}

export interface OrganizerProfile {
  middleName: string;
  bio: string;
  statusText: string;
  contacts: OrganizerContactsSettings;
  cancellation: OrganizerCancellationSettings;
}

export const ORGANIZER_BIO_MAX = 2000;
export const ORGANIZER_STATUS_MAX = 140;

export const ORGANIZER_TIMEZONES = [
  { value: "America/Argentina/Buenos_Aires", label: "Америка/Аргентина/Буэнос-Айрес" },
  { value: "America/Argentina/Cordoba", label: "Америка/Аргентина/Кордова" },
  { value: "America/Argentina/Mendoza", label: "Америка/Аргентина/Мендоса" },
  { value: "Europe/Moscow", label: "Европа/Москва" },
  { value: "Europe/Kaliningrad", label: "Европа/Калининград" },
  { value: "Asia/Yekaterinburg", label: "Азия/Екатеринбург" },
  { value: "Asia/Novosibirsk", label: "Азия/Новосибирск" },
  { value: "Asia/Vladivostok", label: "Азия/Владивосток" },
] as const;

export function createDefaultOrganizerCancellation(
  overrides?: Partial<OrganizerCancellationSettings>
): OrganizerCancellationSettings {
  return {
    policyType: "individual",
    penalties: [{ amount: "", period: "" }],
    additionalConditions: "",
    ...overrides,
  };
}

export function createDefaultOrganizerContacts(
  overrides?: Partial<OrganizerContactsSettings>
): OrganizerContactsSettings {
  return {
    website: "",
    contactEmail: "",
    documentsEmail: "",
    additionalContacts: "",
    vkUrl: "",
    telegramUrl: "",
    otherSocialUrl: "",
    reviewUrls: [""],
    timezone: "America/Argentina/Buenos_Aires",
    weekdayStart: "10:00",
    weekdayEnd: "18:00",
    weekendStart: "12:00",
    weekendEnd: "18:00",
    ...overrides,
  };
}
