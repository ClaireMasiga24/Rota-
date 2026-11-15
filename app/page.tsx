'use client';
import { useCallback, useState } from 'react';
import { CROPS, type CropId, type Priority, type ZoneId } from '@/lib/rota';
import { ZONES } from '@/lib/zones';

export default function Home() {
  const [zoneId,setZoneId] = useState<ZoneId>('karamoja');
  const [cropId,setCropId] = useState<CropId>('maize');
  const [priority,setPriority] = useState<Priority>('water');
  const [rainTrend,setRainTrend] = useState<'declining'|'stable'|'increasing'|'unknown'>('unknown');

  const handleZoneChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setZoneId(event.target.value as ZoneId);
  }, []);

  const handleGenerate = useCallback(() => {
    const params = new URLSearchParams({ zone: zoneId, crop: cropId, priority, rain: rainTrend });
    window.location.href = `/weather?${params.toString()}`;
  }, [zoneId, cropId, priority, rainTrend]);

  return <main>
    <header className="topbar"><a className="brand" href="#top"><span className="brand-mark">R</span><span>rota<span className="brand-light">uganda</span></span></a></header>
    <section className="hero" id="top"><div className="hero-copy"><div className="eyebrow"><span className="live-dot"/> CLIMATE-SMART FARMING, ROOTED IN UGANDA</div><h1>Don't plant the same.<br/><em>Plant what comes next.</em></h1><p>Practical crop-rotation guidance shaped around your location, last season's crop and what matters most to your farm.</p><div className="hero-note"><span>✳</span> A decision-support prototype. Confirm recommendations with local extension officers before planting.</div></div><div className="hero-art"><div className="sun"/><div className="hill hill-back"/><div className="hill hill-front"/><div className="plant plant-one">♧</div><div className="plant plant-two">♧</div><div className="art-label">HEALTHIER SOIL<br/>STARTS BELOW THE SURFACE</div></div></section>
    <section className="workspace"><div className="section-heading"><div><div className="eyebrow dark">YOUR FARM, YOUR NEXT SEASON</div><h2>Build your rotation plan</h2></div><span className="step-pill">01 — FARM PROFILE</span></div>
      <div className="form-grid"><div className="field-card"><label className="field-number">01 <span>LOCATION</span></label><h3>Where is your farm?</h3><p className="field-help">Select your farm's agro-ecological zone. This sets the climate context and shapes the rotation ranking.</p><select value={zoneId} onChange={handleZoneChange}>{ZONES.map(z=> (<option key={z.id} value={z.id}>{z.name}</option>))}</select></div>
      <div className="field-card"><label className="field-number">02 <span>ROTATION HISTORY</span></label><h3>What did you grow last season?</h3><p className="field-help">We'll avoid recommending the same crop again.</p><div className="crop-grid">{CROPS.map(c=><button type="button" key={c.id} className={`crop-option ${cropId===c.id?'selected':''}`} onClick={()=>{setCropId(c.id)}}><span className="crop-symbol">{(c.groups as readonly string[]).includes('legume')?'◉':(c.groups as readonly string[]).includes('root')?'◈':(c.groups as readonly string[]).includes('perennial')?'♧':'✳'}</span>{c.name}<span className="radio-dot"/></button>)}</div></div>
      <div className="field-card priority-card"><label className="field-number">03 <span>YOUR FARM PRIORITY</span></label><h3>What matters most right now?</h3><p className="field-help">We'll rank the options around this goal.</p><div className="priority-list">{([['water','◌','Save water','Choose crops with lower water needs'],['soil','✿','Improve soil','Prioritise soil-supporting crops'],['erosion','⌁','Reduce erosion','Consider ground cover and slope risk'],['income','↗','More income','Prioritise resilient options; validate market returns']] as [Priority,string,string,string][]).map(([id,icon,title,desc])=><button type="button" key={id} className={`priority-option ${priority===id?'selected':''}`} onClick={()=>{setPriority(id)}}><span className="priority-icon">{icon}</span><span><b>{title}</b><small>{desc}</small></span><span className="radio-dot"/></button>)}</div><div className="field-divider"/><label className="small-label" htmlFor="rain">What have you noticed about rainfall?</label><select id="rain" value={rainTrend} onChange={e=>setRainTrend(e.target.value as typeof rainTrend)}><option value="unknown">I don't know / not sure</option><option value="declining">Rainfall is decreasing</option><option value="stable">About the same</option><option value="increasing">Rainfall is increasing</option></select><small className="field-help">Optional farmer observation. It is not satellite-verified climate data.</small></div></div>
      <div className="generate-row"><div><b>Ready to plan your next season?</b><span>Your choices generate three ranked rotation options.</span></div><button className="primary-button" onClick={handleGenerate}>Get my recommendations <span>→</span></button></div>
    </section>
    <footer><div className="footer-brand"><span className="brand-mark">R</span><b>rota<span className="brand-light">uganda</span></b></div><span>Built for farmers. Designed for changing seasons.</span></footer>
  </main>;
}
