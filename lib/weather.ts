/**
 * ROTA - live weather from the NASA POWER Daily API, via the /api/weather route.
 */

export interface WeatherRecord {
  temperature: number | null; // T2M, temperature at 2 metres in °C
  rainfall: number | null;    // PRECTOTCORR, precipitation in mm
  humidity: number | null;    // RH2M, relative humidity at 2 metres in %
}

export interface WeatherData {
  [date: string]: WeatherRecord;
}

export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
  if (!response.ok) {
    throw new Error(`Weather API failed with status ${response.status}`);
  }
  const raw = (await response.json()) as Record<string, Record<string, number | null>>;
  const temperature = raw.T2M ?? {};
  const rainfall = raw.PRECTOTCORR ?? {};
  const humidity = raw.RH2M ?? {};
  const dates = new Set([...Object.keys(temperature), ...Object.keys(rainfall), ...Object.keys(humidity)]);
  const data: WeatherData = {};
  for (const date of dates) {
    data[date] = {
      temperature: temperature[date] ?? null,
      rainfall: rainfall[date] ?? null,
      humidity: humidity[date] ?? null,
    };
  }
  return data;
}
