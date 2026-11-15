import { NextResponse } from 'next/server';

const NASA_POWER_BASE = 'https://power.larc.nasa.gov/api/temporal/daily/point';
const PARAMETERS = 'T2M,PRECTOTCORR,RH2M';
const DEFAULT_LAT = '2.53';
const DEFAULT_LON = '34.66';

function toYyyymmdd(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function lastThirtyDaysEndingThreeDaysAgo() {
  const end = new Date();
  end.setDate(end.getDate() - 3);
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  return { start: toYyyymmdd(start), end: toYyyymmdd(end) };
}

function cleanParameterBlock(values: Record<string, number>): Record<string, number | null> {
  const cleaned: Record<string, number | null> = {};
  for (const [date, value] of Object.entries(values)) {
    cleaned[date] = value === -999 ? null : value;
  }
  return cleaned;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat') || DEFAULT_LAT;
  const lon = searchParams.get('lon') || DEFAULT_LON;
  const { start, end } = lastThirtyDaysEndingThreeDaysAgo();

  const url = new URL(NASA_POWER_BASE);
  url.searchParams.set('start', start);
  url.searchParams.set('end', end);
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('community', 'ag');
  url.searchParams.set('parameters', PARAMETERS);
  url.searchParams.set('format', 'json');

  try {
    const response = await fetch(url.toString(), { next: { revalidate: 86400 } });
    if (!response.ok) {
      return NextResponse.json({ error: `NASA POWER API failed with status ${response.status}` }, { status: 502 });
    }
    const payload = await response.json();
    const parameter = payload?.properties?.parameter as Record<string, Record<string, number>> | undefined;
    if (!parameter) {
      return NextResponse.json({ error: 'NASA POWER API returned no data' }, { status: 502 });
    }

    const cleaned: Record<string, Record<string, number | null>> = {};
    for (const [parameterName, values] of Object.entries(parameter)) {
      cleaned[parameterName] = cleanParameterBlock(values);
    }
    return NextResponse.json(cleaned);
  } catch {
    return NextResponse.json({ error: 'Unable to load weather data from NASA POWER' }, { status: 502 });
  }
}
