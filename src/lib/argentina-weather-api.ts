import { weatherCodePresentation } from "@/lib/weather-codes";

export type WeatherDayForecast = {
  date: string;
  label: string;
  highC: number;
  lowC: number;
  precipitationMm: number;
  weatherCode: number;
  presentation: ReturnType<typeof weatherCodePresentation>;
};

export type WeatherForecastResult = {
  regionId: string;
  days: WeatherDayForecast[];
  fetchedAt: string;
};

type OpenMeteoDaily = {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
};

const DAY_LABELS = ["Вчера", "Сегодня", "Завтра"] as const;

export async function fetchArgentinaWeatherForecast(params: {
  regionId: string;
  latitude: number;
  longitude: number;
  timezone: string;
}): Promise<WeatherForecastResult> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(params.latitude));
  url.searchParams.set("longitude", String(params.longitude));
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum"
  );
  url.searchParams.set("past_days", "1");
  url.searchParams.set("forecast_days", "2");
  url.searchParams.set("timezone", params.timezone);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const json = (await response.json()) as { daily: OpenMeteoDaily };
  const { daily } = json;

  const days: WeatherDayForecast[] = daily.time.slice(0, 3).map((date, index) => ({
    date,
    label: DAY_LABELS[index] ?? date,
    highC: Math.round(daily.temperature_2m_max[index] ?? 0),
    lowC: Math.round(daily.temperature_2m_min[index] ?? 0),
    precipitationMm: daily.precipitation_sum[index] ?? 0,
    weatherCode: daily.weather_code[index] ?? 0,
    presentation: weatherCodePresentation(daily.weather_code[index] ?? 0),
  }));

  return {
    regionId: params.regionId,
    days,
    fetchedAt: new Date().toISOString(),
  };
}
