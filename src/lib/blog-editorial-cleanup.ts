const BARE_SOURCE_NAMES = new Set(
  [
    "Wikipedia",
    "Википедия",
    "Reddit",
    "Tripadvisor",
    "Т—Ж",
    "Туризм По Руте 40",
    "Rome2Rio",
    "FlightConnections",
    "Argentina Travel",
    "Turismo Buenos Aires",
    "Biker Street Buenos Aires Bike Tours",
    "Time Out Worldwide",
    "El Prisma de Fer",
    "Reuters",
    "Tango Argentina",
    "Viator",
    "KAYAK",
    "Laura the Explorer",
    "Rebecca’s International Kitchen",
    "TourRadar",
    "Asadoadventure",
    "Immi legal",
    "Mater Travel",
    "Tangol",
    "TorresDelPaine.com",
    "Tango.ORG",
    "El País",
    "Condé Nast Traveler",
    "BailaBA",
    "Trailo",
    "Hostelworld",
    "YETI TOUR",
    "Never Ending Footsteps",
    "Sue Where Why What",
    "Blueprint Travelers",
    "The Times",
    "Buenos Aires Times",
    "Cancillería Argentina",
    "Embajada en Singapur",
    "Яндекс Путешествия",
    "GetYourGuide",
    "Форум Винского",
    "Journey By Backpack",
    "Booking",
    "Busbud",
    "RipioTurismo",
    "Musafir in Transit",
    "New York Post",
    "Благое Руководство по Аргентине",
    "Скайсканер",
    "Peninsula Valdes",
    "ИнтерПатагония",
    "Pingüinos en Tombo",
    "Punta Tombo Turismo",
    "Iguazu falls tickets",
  ].map((name) => name.toLocaleLowerCase("ru")),
);

const PARENTHETICAL = /\s*\(([^()\n]{1,120})\)/gu;
const BARE_DOMAIN_OR_URL = /^(?:https?:\/\/)?(?:www\.)?(?:[\w-]+\.)+[a-z]{2,}(?:\/\S*)?$/iu;

function isBareSourceMarker(value: string): boolean {
  const normalized = value.trim().replace(/\s+/g, " ");
  return (
    BARE_SOURCE_NAMES.has(normalized.toLocaleLowerCase("ru")) ||
    BARE_DOMAIN_OR_URL.test(normalized)
  );
}

/**
 * Removes legacy source labels that have no URL or bibliographic data.
 * Verifiable structured Markdown links `[label](url)` are intentionally left untouched.
 */
export function cleanLegacyBlogSourceMarkers(text: string): string {
  const markdownLinks: string[] = [];
  const withProtectedLinks = text.replace(
    /\[([^\]]+)\]\((\/[^)\s]+|https?:\/\/[^)\s]+)\)/g,
    (match) => {
      const index = markdownLinks.length;
      markdownLinks.push(match);
      return `%%BLOG_SRC_MD_LINK_${index}%%`;
    },
  );

  const cleaned = withProtectedLinks
    .replace(PARENTHETICAL, (match, value: string) =>
      isBareSourceMarker(value) ? "" : match,
    )
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return cleaned.replace(/%%BLOG_SRC_MD_LINK_(\d+)%%/g, (_, rawIndex: string) => {
    return markdownLinks[Number(rawIndex)] ?? "";
  });
}
