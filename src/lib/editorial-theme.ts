export type EditorialTheme =
  | "default"
  | "journal"
  | "rainforest"
  | "glacier"
  | "wine"
  | "highland"
  | "city";

const DESTINATION_THEMES: Readonly<Record<string, EditorialTheme>> = {
  ba: "city",
  bariloche: "highland",
  calafate: "glacier",
  iguazu: "rainforest",
  mendoza: "wine",
  patagonia: "glacier",
  salta: "highland",
  ushuaia: "glacier",
};

const GUIDE_THEMES: Readonly<Record<string, EditorialTheme>> = {
  "dostoprimechatelnosti": "rainforest",
  "gde-zhit": "city",
  "istoriya": "city",
  "kak-dobratsya": "highland",
  "kultura": "city",
  "kukhnya": "wine",
  "pogoda-i-sezonnost": "glacier",
  "shopping": "city",
  "turistskie-regiony": "glacier",
};

export function resolveDestinationEditorialTheme(destinationId: string): EditorialTheme {
  return DESTINATION_THEMES[destinationId] ?? "default";
}

export function resolveGuideEditorialTheme(slug: string): EditorialTheme {
  return GUIDE_THEMES[slug] ?? "journal";
}

export function resolveBlogEditorialTheme(input: {
  title: string;
  category: string;
  tags: string[];
  relatedDestinations?: string[];
}): EditorialTheme {
  const destinationTheme = input.relatedDestinations
    ?.map(resolveDestinationEditorialTheme)
    .find((theme) => theme !== "default");

  if (destinationTheme) return destinationTheme;

  const haystack = [input.title, input.category, ...input.tags].join(" ").toLocaleLowerCase("ru-RU");

  if (/игуас|водопад|джунг|тропич/.test(haystack)) return "rainforest";
  if (/ледник|перито|патагони|ушуа|снег|треккинг|гора/.test(haystack)) return "glacier";
  if (/мендос|вино|винодел|мальбек|гастроном/.test(haystack)) return "wine";
  if (/сальт|жужу|рута|пустын|северо-запад/.test(haystack)) return "highland";
  if (/буэнос|танго|город|район|архитектур|транспорт/.test(haystack)) return "city";

  return "journal";
}
