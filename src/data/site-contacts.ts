export const SITE_PHONES = [
  {
    label: "Россия",
    display: "+7 (999) 922-65-64",
    tel: "+79999226564",
    whatsapp: "https://wa.me/79999226564",
  },
  {
    label: "Аргентина",
    display: "+54 (911) 6686-3994",
    tel: "+5491166863994",
    whatsapp: "https://wa.me/5491166863994",
  },
] as const;

export const SITE_EMAIL = {
  display: "IAEvdokimychev@ya.ru",
  href: "mailto:IAEvdokimychev@ya.ru",
  note: "Почта для связи, предложений и сотрудничества",
} as const;

export const SITE_OFFICE = {
  display: "Буэнос-Айрес, Аргентина",
  note: "Основной офис и команда на месте",
  mapEmbedUrl:
    "https://maps.google.com/maps?q=Buenos+Aires,+Argentina&z=11&output=embed",
} as const;

export const SITE_WORKING_HOURS =
  "Понедельник – суббота: 10:00–18:00 (Буэнос-Айрес), 16:00–00:00 (Москва)";

export const SITE_WHATSAPP_URL = SITE_PHONES[0].whatsapp;

export const SITE_TELEGRAM_URL = "https://t.me/ivievd";
export const SITE_INSTAGRAM_URL = "https://instagram.com/iv.evd";
