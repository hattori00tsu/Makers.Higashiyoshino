"use client";

import type { DailyWeather } from "@/lib/weather";
import { weatherLabel } from "@/lib/weather";
import { useLocale, useMessages } from "@/lib/i18n/provider";

type Props = {
  weather?: DailyWeather;
  outdoor: boolean;
};

export function WeatherNote({ weather, outdoor }: Props) {
  const locale = useLocale();
  const t = useMessages();
  if (!outdoor) return null;

  if (!weather) {
    return <p className="text-sm leading-7 text-sumi-soft">{t.weather.outdoorSoon}</p>;
  }

  return (
    <p className="text-sm leading-7 text-sumi-soft">
      {t.weather.forecast(weatherLabel(weather.code, locale), weather.tempMax, weather.tempMin)}
      <span className="ml-2 text-[11px] tracking-wide">{t.weather.place}</span>
    </p>
  );
}
