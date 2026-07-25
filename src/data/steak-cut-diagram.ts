/**
 * Data for the beef-cut diagram (SteakCutDiagram).
 * `x`/`y` are percentages (0–100) placing each pin over the generated cow
 * illustration — approximate, not anatomically precise (see disclaimer in UI copy).
 */
export type SteakCutDiagramIcon =
  | "ribs"
  | "ribeye"
  | "strip"
  | "tenderloin"
  | "skirt"
  | "flank"
  | "triangle";

export type SteakCutDiagramZone = {
  id: string;
  number: number;
  name: string;
  x: number;
  y: number;
  icon: SteakCutDiagramIcon;
  description: string;
};

export const STEAK_CUT_DIAGRAM_ZONES: SteakCutDiagramZone[] = [
  {
    id: "asado-de-tira",
    number: 1,
    name: "Asado de tira",
    x: 34,
    y: 28,
    icon: "ribs",
    description: "Рёбра, распиленные поперёк — ближе к передней части.",
  },
  {
    id: "ojo-de-bife",
    number: 2,
    name: "Ojo de bife",
    x: 50,
    y: 20,
    icon: "ribeye",
    description: "Рёберная часть спины — мраморный и сочный кусок.",
  },
  {
    id: "bife-de-chorizo",
    number: 3,
    name: "Bife de chorizo",
    x: 74,
    y: 24,
    icon: "strip",
    description: "Спинно-поясничная часть — классический толстый стейк.",
  },
  {
    id: "lomo",
    number: 4,
    name: "Lomo",
    x: 53,
    y: 38,
    icon: "tenderloin",
    description: "Вырезка под поясничной частью — самый нежный отруб.",
  },
  {
    id: "entrana",
    number: 5,
    name: "Entraña",
    x: 32,
    y: 50,
    icon: "skirt",
    description: "Область диафрагмы — тонкое ароматное мясо.",
  },
  {
    id: "vacio",
    number: 6,
    name: "Vacío",
    x: 58,
    y: 50,
    icon: "flank",
    description: "Брюшная часть — крупный волокнистый отруб.",
  },
  {
    id: "colita",
    number: 7,
    name: "Colita de cuadril",
    x: 85,
    y: 30,
    icon: "triangle",
    description: "Задняя часть у бедра — треугольный отруб.",
  },
];

export const STEAK_CUT_DIAGRAM_UI = {
  ariaLabel: "Схема расположения основных отрубов на туше",
  title: "Где на туше находятся эти отрубы",
  hint: "Приблизительная схема для ориентира по меню, а не анатомический атлас.",
  disclaimer:
    "Схема условна и не отражает анатомически точные границы отрубов — реальная разделка туши сложнее. Официальная номенклатура: IPCVA / Carne Argentina.",
  disclaimerLinkLabel: "Nomenclador de cortes (IPCVA)",
  disclaimerHref: "https://carneargentina.org.ar/nomenclador-de-cortes",
};
