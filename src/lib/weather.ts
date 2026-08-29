import type { Locale } from "@/lib/i18n/locale";
import { village } from "@/data/site";

export type DailyWeather = {
  date: string;
  code: number;
  label: string;
  tempMax: number;
  tempMin: number;
};

type ForecastResponse = {
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
};

export function weatherLabel(code: number, locale: Locale = "ja") {
  const en = locale === "en";
  if (code === 0) return en ? "Clear" : "快晴";
  if (code <= 3) return en ? "Fair" : "晴れ";
  if (code <= 48) return en ? "Fog" : "霧";
  if (code <= 57) return en ? "Drizzle" : "霧雨";
  if (code <= 67) return en ? "Rain" : "雨";
  if (code <= 77) return en ? "Snow" : "雪";
  if (code <= 82) return en ? "Showers" : "にわか雨";
  if (code <= 86) return en ? "Snow" : "雪";
  return en ? "Thunderstorm" : "雷雨";
}

function finiteNumber(value: unknown) {
  const next = typeof value === "number" ? value : Number(value);
  return Number.isFinite(next) ? next : null;
}

export async function getVillageForecast(): Promise<Record<string, DailyWeather>> {
  const params = new URLSearchParams({
    latitude: String(village.lat),
    longitude: String(village.lng),
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "Asia/Tokyo",
    forecast_days: "16",
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return {};
    const data = (await response.json()) as ForecastResponse;
    const daily = data.daily;
    if (!daily) return {};

    const result: Record<string, DailyWeather> = {};
    daily.time.forEach((date, index) => {
      const code = finiteNumber(daily.weather_code[index]);
      const tempMax = finiteNumber(daily.temperature_2m_max[index]);
      const tempMin = finiteNumber(daily.temperature_2m_min[index]);
      if (code == null || tempMax == null || tempMin == null) return;
      result[date] = {
        date,
        code,
        label: weatherLabel(code),
        tempMax: Math.round(tempMax),
        tempMin: Math.round(tempMin),
      };
    });
    return result;
  } catch {
    return {};
  }
}
