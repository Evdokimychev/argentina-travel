import { Font } from "@react-pdf/renderer";

let registered = false;

export function registerTourPdfFonts(): void {
  if (registered) return;

  Font.register({
    family: "TourPdfSans",
    fonts: [
      {
        src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@5.2.5/files/noto-sans-cyrillic-400-normal.woff",
        fontWeight: 400,
      },
      {
        src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@5.2.5/files/noto-sans-cyrillic-600-normal.woff",
        fontWeight: 600,
      },
      {
        src: "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@5.2.5/files/noto-sans-cyrillic-700-normal.woff",
        fontWeight: 700,
      },
    ],
  });

  registered = true;
}
