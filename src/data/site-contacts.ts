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
  display: "hello@goargentina.ru",
  href: "mailto:hello@goargentina.ru",
  note: "Почта для связи, предложений и сотрудничества",
} as const;

export const SITE_OFFICE = {
  display: "Буэнос-Айрес, Аргентина",
  note: "Основной офис и команда на месте",
} as const;

export const SITE_WORKING_HOURS =
  "Понедельник – суббота: 10:00–18:00 (Буэнос-Айрес), 16:00–00:00 (Москва)";

export const SITE_WHATSAPP_URL = SITE_PHONES[0].whatsapp;
