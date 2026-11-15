'use client';
import { useEffect, useState } from 'react';
import { getWeather, type WeatherData } from '@/lib/weather';

export default function WeatherPage() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getWeather(2.53, 34.66)
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load weather data'); });
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <main>
        <h1>Weather - Moroto, Karamoja</h1>
        <p>Error: {error}</p>
      </main>
    );
  }
  if (!data) {
    return <main><p>Loading...</p></main>;
  }

  const rows = Object.entries(data).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return (
    <main>
      <h1>Weather - Moroto, Karamoja</h1>
      <p>Last 30 days from NASA POWER</p>
      <ul>
        {rows.map(([date, record]) => (
          <li key={date}>
            {date} - {record.temperature === null ? 'n/a' : record.temperature + '°C'} ·
            {record.rainfall === null ? 'n/a' : record.rainfall + 'mm'}
          </li>
        ))}
      </ul>
    </main>
  );
}
