/** IATA → локальный PNG в `/public/airlines/` */
const AIRLINE_IATA_BY_NAME: Record<string, string | string[]> = {
  "Turkish Airlines": "TK",
  Iberia: "IB",
  "Qatar Airways": "QR",
  LATAM: "LA",
  Emirates: "EK",
  "Ethiopian Airlines": "ET",
  "Air Europa": "UX",
  Lufthansa: "LH",
  "Air France": "AF",
  KLM: "KL",
  "Copa Airlines": "CM",
  Avianca: "AV",
  "American Airlines": "AA",
  "United / Delta": ["UA", "DL"],
  "Aerolíneas Argentinas": "AR",
  JetSMART: "JA",
  Flybondi: "FO",
};

export function getAirlineIataCodes(name: string): string[] {
  const codes = AIRLINE_IATA_BY_NAME[name];
  if (!codes) return [];
  return Array.isArray(codes) ? codes : [codes];
}

export function getAirlineLogoSrc(iataCode: string): string {
  return `/airlines/${iataCode}.png`;
}

export function getAirlineInitials(name: string): string {
  const words = name.split(/[\s/]+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
