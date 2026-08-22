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

export function weatherLabel(code: number) {
  if (code === 0) return "快晴";
  if (code <= 3) return "晴れ";
  if (code <= 48) return "霧";
  if (code <= 57) return "霧雨";
  if (code <= 67) return "雨";
  if (code <= 77) return "雪";
  if (code <= 82) return "にわか雨";
  if (code <= 86) return "雪";
  return "雷雨";
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
      const code = daily.weather_code[index];
      result[date] = {
        date,
        code,
        label: weatherLabel(code),
        tempMax: Math.round(daily.temperature_2m_max[index]),
        tempMin: Math.round(daily.temperature_2m_min[index]),
      };
    });
    return result;
  } catch {
    return {};
  }
}
