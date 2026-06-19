/** Внешняя ссылка на бронирование (Custom Booking Link). */
export interface TourCustomBookingLink {
  enabled: boolean;
  url: string;
  /** Текст кнопки на странице тура. */
  label: string;
  /** Открывать в новой вкладке. */
  openInNewTab: boolean;
  /** Подсказка туристу под кнопкой. */
  hint?: string;
  /** Передавать в URL количество туристов и дату (если выбраны). */
  passContext: boolean;
}

export interface TourCustomBookingLinkPublic {
  url: string;
  label: string;
  openInNewTab: boolean;
  hint?: string;
  passContext: boolean;
}
