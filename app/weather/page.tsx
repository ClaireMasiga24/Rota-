'use client';
import { useEffect, useState } from 'react';
import { CROPS, recommend, type CropId, type Priority, type ZoneId } from '@/lib/rota';
import { getWeather, type WeatherData } from '@/lib/weather';
import { WeatherChart } from '@/components/WeatherChart';
import { ZONES } from '@/lib/zones';

const priorityLabels: Record<Priority,string> = { water: 'Save water', soil: 'Improve soil', erosion: 'Reduce erosion', income: 'More income' };
const fmt = (n:number) => `${n > 0 ? '+' : ''}${n}`;

function paramOrDefault<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  if (value && allowed.includes(value as T)) return value as T;
  return fallback;
}

export default function WeatherPage() {
  const [zoneId, setZoneId] = useState<ZoneId>('karamoja');
  const [cropId, setCropId] = useState<CropId>('maize');
  const [priority, setPriority] = useState<Priority>('water');
  const [rainTrend, setRainTrend] = useState<'declining'|'stable'|'increasing'|'unknown'>('unknown');
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setZoneId(paramOrDefault(params.get('zone'), ZONES.map(z => z.id), 'karamoja'));
    setCropId(paramOrDefault(params.get('crop'), CROPS.map(c => c.id), 'maize'));
    setPriority(paramOrDefault(params.get('priority'), ['water','soil','erosion','income'] as const, 'water'));
    setRainTrend(paramOrDefault(params.get('rain'), ['declining','stable','increasing','unknown'] as const, 'unknown'));
  }, []);

  const zone = ZONES.find(z => z.id === zoneId)!;
  const lat = zone.lat;
  const lon = zone.lon;

  // Screen 2: live NASA POWER call for the selected zone's representative coordinates.
  useEffect(() => {
    let cancelled = false;
    getWeather(lat, lon)
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load weather data'); });
    return () => { cancelled = true; };
  }, [lat, lon]);

  // Screen 3: recommendation cards using the same zone, last crop and priority.
  const result = recommend(zoneId, cropId, priority, rainTrend);

  if (error) {
    return (
      <main>
        <h1>Weather - {zone.name}</h1>
        <p>Error: {error}</p>
      </main>
    );
  }
  if (!data) {
    return <main><p>Loading...</p></main>;
  }

  return <main>
    <h1>Weather - {zone.name}</h1>
    <p>Last 30 days from NASA POWER</p>
    <WeatherChart data={data} />

    <section className="results" id="results"><div className="section-heading"><div><div className="eyebrow dark">YOUR ROTATION PLAN · {zone.name.toUpperCase()}</div><h2>What to consider planting next</h2></div><span className="step-pill">02 — RECOMMENDATIONS</span></div><div className="result-summary"><div><span className="summary-label">YOUR FARM PROFILE</span><b>{zone.name}</b><small>{result.previous.name} last season · Priority: {priorityLabels[priority]}</small></div><div className="summary-climate"><span>LOCAL CONTEXT</span><b>{zone.annualRainfallMm ? `~${zone.annualRainfallMm} mm/year*` : 'Local rainfall data needed'}</b><small>{zone.flags.join(' · ')}</small></div></div><div className="recommendation-grid">{result.recommendations.map((r,i)=><article className={`recommendation ${i===0?'recommended':''}`} key={r.crop.id}><div className="rec-top"><span className="rec-rank">0{i+1}</span>{i===0&&<span className="best-label">TOP MATCH</span>}</div><div className="rec-crop-icon">{(r.crop.groups as readonly string[]).includes('legume')?'◉':(r.crop.groups as readonly string[]).includes('root')?'◈':(r.crop.groups as readonly string[]).includes('perennial')?'♧':'✳'}</div><div className="rec-name">{r.crop.name}</div><div className="rec-subtitle">After {result.previous.name}</div><div className="rec-stats"><div><small>Indicative water need</small><b>{r.crop.water} <small>mm*</small></b></div><div><small>Water change vs last crop</small><b className={r.waterSaving>=0?'positive':'negative'}>{fmt(r.waterSaving)}%</b></div><div><small>Nitrogen reference</small><b>{fmt(r.crop.nitrogen)} <small>kg/ha*</small></b></div></div><div className="why"><b>Why it appears here</b><ul>{r.reasons.slice(0,3).map((reason,j)=><li key={j}>{reason}</li>)}</ul></div><div className="caution">Check seed availability, planting dates, soil condition and local pest/disease advice before planting.</div></article>)}</div><div className="data-note"><b>Evidence & limitations</b><p>*The water requirement, nitrogen and drought/erosion scores are indicative prototype values taken from the project brief, not validated field measurements for this district. Zone context and rainfall figures are also provisional project inputs. Rainfall and temperature on this screen come from the live NASA POWER response. “More income” is a resilience proxy, not a profit forecast.</p></div><button className="secondary-button" onClick={()=>{window.location.href='/';}}>← Edit farm details</button></section>
  </main>;
}
