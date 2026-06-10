export type WeatherPresentation = {
  label: string;
  emoji: string;
};

/** WMO weather interpretation codes (Open-Meteo). */
export function weatherCodePresentation(code: number): WeatherPresentation {
  if (code === 0) return { label: "Ясно", emoji: "☀️" };
  if (code <= 3) return { label: "Переменная облачность", emoji: "⛅" };
  if (code <= 48) return { label: "Туман", emoji: "🌫️" };
  if (code <= 57) return { label: "Морось", emoji: "🌦️" };
  if (code <= 67) return { label: "Дождь", emoji: "🌧️" };
  if (code <= 77) return { label: "Снег", emoji: "🌨️" };
  if (code <= 82) return { label: "Ливень", emoji: "🌧️" };
  if (code <= 86) return { label: "Снегопад", emoji: "❄️" };
  if (code <= 99) return { label: "Гроза", emoji: "⛈️" };
  return { label: "Облачно", emoji: "☁️" };
}
