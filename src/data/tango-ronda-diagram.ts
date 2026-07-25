/**
 * Data for the accessible ronda movement diagram (TangoRondaDiagram).
 * The component renders a semantic inline SVG — no raster, no baked-in text.
 * Legend labels and the SVG title/description live here as plain strings so
 * they stay readable, translatable and available without JavaScript.
 */
export const TANGO_RONDA_DIAGRAM_UI = {
  ariaLabel: "Схема движения по ronda на танцполе",
  title: "Как движется ronda",
  hint: "Общий поток идёт против часовой стрелки по внешним дорожкам. Центр не пересекают напрямую.",
  svgTitle: "Схема движения пар по танцполу против часовой стрелки",
  svgDescription:
    "Прямоугольный танцпол. Стрелки по внешнему краю показывают движение против часовой стрелки. Внешняя и внутренняя дорожки — это линии потока. Центральная зона отмечена как область, которую не пересекают напрямую. Отдельная отметка показывает безопасный вход в поток с края площадки.",
} as const;

export type TangoRondaLegendItem = {
  id: string;
  /** Tailwind text-color class for the swatch — never the only signal (icon + label carry meaning too). */
  swatchClass: string;
  label: string;
  description: string;
};

export const TANGO_RONDA_LEGEND: TangoRondaLegendItem[] = [
  {
    id: "flow",
    swatchClass: "text-sky",
    label: "Направление потока",
    description: "Против часовой стрелки по внешним дорожкам.",
  },
  {
    id: "lanes",
    swatchClass: "text-emerald-600 dark:text-emerald-400",
    label: "Дорожки",
    description: "Держитесь своей линии, не перестраивайтесь резко.",
  },
  {
    id: "entry",
    swatchClass: "text-amber-600 dark:text-amber-400",
    label: "Безопасный вход",
    description: "Входите в промежуток, установив контакт с приближающейся парой.",
  },
  {
    id: "center",
    swatchClass: "text-rose-600 dark:text-rose-400",
    label: "Центр не пересекать",
    description: "Не идите напрямую через середину поперёк потока.",
  },
];
