'use client';

import { useState } from 'react';
import { WeatherData, WeatherRecord } from '@/lib/weather';

const MARGIN = { l: 66, r: 66, t: 10, b: 46 };
const VIEW_W = 740;
const VIEW_H = 300;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtDate(yyyymmdd: string): string {
  const dt = new Date(+yyyymmdd.slice(0, 4), +yyyymmdd.slice(4, 6) - 1, +yyyymmdd.slice(6, 8));
  return `${MONTHS[dt.getMonth()]} ${dt.getDate()}`;
}

function niceTicks(lo: number, hi: number, count: number): number[] {
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) return [lo];
  const step = (hi - lo) / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(step)));
  let stepSize = step / magnitude;
  if (stepSize > 5) stepSize = 10;
  else if (stepSize > 2) stepSize = 5;
  else if (stepSize > 1) stepSize = 2;
  else stepSize = 1;
  stepSize *= magnitude;
  const ticks: number[] = [];
  for (let v = Math.ceil(lo / stepSize) * stepSize; v <= hi; v += stepSize) ticks.push(v);
  return ticks;
}

function buildPath(
  entries: [string, WeatherRecord][],
  getValue: (r: WeatherRecord) => number | null,
  getY: (v: number) => number,
  xPos: (i: number) => number,
): string {
  let path = '';
  let seg = '';
  entries.forEach(([, r], i) => {
    const v = getValue(r);
    if (v === null) { if (seg) { path += seg; seg = ''; } return; }
    const p = `${xPos(i)},${getY(v)}`;
    seg += (seg ? ' L' : 'M') + p;
  });
  if (seg) path += seg;
  return path;
}

export function WeatherChart({ data }: { data: WeatherData }) {
  const [hover, setHover] = useState<{
    index: number;
    x: number;
    yTemp: number;
    yRain: number;
    date: string;
    temp: string;
    rain: string;
  } | null>(null);

  const entries = Object.entries(data).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const n = entries.length;
  if (n === 0) return null;

  const temps: number[] = [];
  const rains: number[] = [];
  for (const [, r] of entries) {
    if (r.temperature !== null) temps.push(r.temperature);
    if (r.rainfall !== null) rains.push(r.rainfall);
  }
  const hasTemp = temps.length > 0;
  const hasRain = rains.length > 0;

  const tMin = hasTemp ? Math.min(...temps) : 0;
  const tMax = hasTemp ? Math.max(...temps) : 0;
  const tRange = Math.max(tMax - tMin, 1);
  const tPad = Math.max(tRange * 0.2, 2);
  const tLo = tMin - tPad;
  const tHi = tMax + tPad;

  const rMax = hasRain ? Math.max(...rains) : 0;
  const rHi = Math.max(rMax * 1.25, 1);

  const x0 = MARGIN.l;
  const x1 = VIEW_W - MARGIN.r;
  const y0 = MARGIN.t;
  const y1 = VIEW_H - MARGIN.b;
  const pw = x1 - x0;
  const ph = y1 - y0;

  const xPos = (i: number) => (n === 1 ? x0 + pw / 2 : x0 + (i / (n - 1)) * pw);
  const yTemp = (v: number) => y1 - ((v - tLo) / (tHi - tLo)) * ph;
  const yRain = (v: number) => y1 - (v / rHi) * ph;

  const last = entries[n - 1][1];
  const latestTemp = last.temperature === null ? 'n/a' : last.temperature.toFixed(0) + '°C';
  const latestRain = last.rainfall === null ? 'n/a' : last.rainfall.toFixed(0) + 'mm';

  const tempPath = buildPath(entries, (r) => r.temperature, yTemp, xPos);
  const rainPath = buildPath(entries, (r) => r.rainfall, yRain, xPos);

  const tempTicks = niceTicks(tLo, tHi, 5);
  const rainTicks = niceTicks(0, rHi, 5);

  const labelStep = Math.max(1, Math.floor(n / 7));

  function onMove(e: React.MouseEvent<SVGRectElement>) {
    const svg = e.currentTarget.ownerSVGElement!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const p = pt.matrixTransform(ctm.inverse());
    let i = Math.round(((p.x - x0) / pw) * (n - 1));
    i = Math.max(0, Math.min(n - 1, i));
    const [date, r] = entries[i];
    setHover({
      index: i,
      x: xPos(i),
      yTemp: r.temperature === null ? yTemp(tLo) : yTemp(r.temperature),
      yRain: r.rainfall === null ? yRain(0) : yRain(r.rainfall),
      date: fmtDate(date),
      temp: r.temperature === null ? 'n/a' : r.temperature.toFixed(1) + '°C',
      rain: r.rainfall === null ? 'n/a' : r.rainfall.toFixed(1) + 'mm',
    });
  }

  return (
    <div className="weather-chart">
      <svg className="chart-svg" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%" height="100%" role="img" aria-label="Temperature and rainfall trends over the last 30 days">
        <defs>
          <clipPath id="chart-clip">
            <rect x={x0} y={y0} width={pw} height={ph} />
          </clipPath>
        </defs>

        {/* temperature gridlines */}
        {tempTicks.map((tick) => {
          const yy = yTemp(tick);
          return <line key={tick} x1={x0} x2={x1} y1={yy} y2={yy} stroke="#edf0eb" strokeWidth={1} />;
        })}

        <g clipPath="url(#chart-clip)">
          <path d={tempPath} stroke="#d18b45" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={rainPath} stroke="#236b49" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {hover && (
            <>
              <line x1={hover.x} x2={hover.x} y1={y0} y2={y1} stroke="#e4e9e0" strokeWidth={1} strokeDasharray="4 4" />
              <circle cx={hover.x} cy={hover.yTemp} r={3.5} fill="#d18b45" />
              <circle cx={hover.x} cy={hover.yRain} r={3.5} fill="#236b49" />
            </>
          )}
        </g>

        <g className="axes">
          {/* left axis: temperature */}
          {tempTicks.map((tick) => {
            const yy = yTemp(tick);
            return (
              <g key={tick}>
                <line x1={x0 - 6} x2={x0} y1={yy} y2={yy} stroke="#c8d2c8" strokeWidth={1} />
                <text x={x0 - 10} y={yy + 3} textAnchor="end" className="axis-tick">{tick.toFixed(0)}</text>
              </g>
            );
          })}
          <text x={x0 - 22} y={y0 - 8} textAnchor="end" className="axis-label">Temp °C</text>

          {/* right axis: rainfall */}
          {rainTicks.map((tick) => {
            const yy = yRain(tick);
            return (
              <g key={tick}>
                <line x1={x1} x2={x1 + 6} y1={yy} y2={yy} stroke="#c8d2c8" strokeWidth={1} />
                <text x={x1 + 10} y={yy + 3} textAnchor="start" className="axis-tick">{tick.toFixed(0)}</text>
              </g>
            );
          })}
          <text x={x1 + 22} y={y0 - 8} textAnchor="start" className="axis-label">Rain mm</text>

          {/* x axis dates */}
          {entries.map(([date], i) => {
            if (i % labelStep !== 0 && i !== n - 1) return null;
            const xx = xPos(i);
            return (
              <g key={date}>
                <line x1={xx} x2={xx} y1={y1} y2={y1 + 5} stroke="#c8d2c8" strokeWidth={1} />
                <text x={xx} y={y1 + 19} textAnchor="middle" className="x-label">{fmtDate(date)}</text>
              </g>
            );
          })}
        </g>

        <rect
          x={x0}
          y={y0}
          width={pw}
          height={ph}
          fill="transparent"
          cursor="crosshair"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        />

        {hover && (
          <g>
            <rect x={hover.x + 10} y={hover.yTemp - 44} width={100} height={32} rx={5} fill="#fff" stroke="#c8d2c8" strokeWidth={1} opacity={0.95} />
            <text x={hover.x + 18} y={hover.yTemp - 32} className="tooltip" fill="#64766a">{hover.date}</text>
            <text x={hover.x + 18} y={hover.yTemp - 16} className="tooltip" fill="#d18b45" style={{ fontWeight: 600 }}>Temp {hover.temp}</text>
            <text x={hover.x + 58} y={hover.yTemp - 16} className="tooltip" fill="#236b49" style={{ fontWeight: 600 }}>Rain {hover.rain}</text>
          </g>
        )}
      </svg>

      <div className="legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#d18b45' }} />
          Temperature · latest {latestTemp}
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#236b49' }} />
          Rainfall · latest {latestRain}
        </div>
      </div>
    </div>
  );
}
