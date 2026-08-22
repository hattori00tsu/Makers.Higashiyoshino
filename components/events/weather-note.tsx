import type { DailyWeather } from "@/lib/weather";

type Props = {
  weather?: DailyWeather;
  outdoor: boolean;
};

export function WeatherNote({ weather, outdoor }: Props) {
  if (!outdoor) return null;

  if (!weather) {
    return (
      <p className="text-sm leading-7 text-sumi-soft">
        屋外の催しです。天気予報は、開催が近づくと表示します（Open-Meteo）。
      </p>
    );
  }

  return (
    <p className="text-sm leading-7 text-sumi-soft">
      村の予報：{weather.label}　最高{weather.tempMax}° / 最低{weather.tempMin}°
      <span className="ml-2 text-[11px] tracking-wide">東吉野村役場付近 · Open-Meteo</span>
    </p>
  );
}
