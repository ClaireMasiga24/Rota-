import { ZONES, type ZoneId } from './zones';
export { ZONES };
export type { ZoneId };

export type Priority = 'water' | 'soil' | 'erosion' | 'income';

// Prototype agronomic reference values supplied in the project brief/code.
// They are indicative scoring inputs, NOT verified local measurements or guarantees.
export const CROPS = [
  { id: 'maize', name: 'Maize', water: 650, nitrogen: -30, drought: 1, erosion: 1, zones: ['central','eastern','northern','westnile','western','southwest','elgon','rwenzori','lake'] as ZoneId[], groups: ['cereal'] },
  { id: 'beans', name: 'Beans', water: 400, nitrogen: 40, drought: 2, erosion: 2, zones: ZONES.map(z=>z.id), groups: ['legume'] },
  { id: 'cassava', name: 'Cassava', water: 350, nitrogen: 0, drought: 3, erosion: 1, zones: ['central','eastern','northern','westnile','western','rwenzori'] as ZoneId[], groups: ['root'] },
  { id: 'sorghum', name: 'Sorghum', water: 350, nitrogen: -10, drought: 3, erosion: 1, zones: ['karamoja','northern','westnile','eastern','western'] as ZoneId[], groups: ['cereal'] },
  { id: 'millet', name: 'Millet', water: 300, nitrogen: -10, drought: 3, erosion: 1, zones: ['karamoja','northern','eastern','westnile'] as ZoneId[], groups: ['cereal'] },
  { id: 'cowpeas', name: 'Cowpeas', water: 280, nitrogen: 35, drought: 3, erosion: 2, zones: ['karamoja','northern','westnile','eastern'] as ZoneId[], groups: ['legume'] },
  { id: 'groundnuts', name: 'Groundnuts', water: 400, nitrogen: 30, drought: 2, erosion: 2, zones: ['western','eastern','central','rwenzori','northern','westnile'] as ZoneId[], groups: ['legume'] },
  { id: 'rice', name: 'Rice', water: 900, nitrogen: -25, drought: 1, erosion: 1, zones: ['eastern','rwenzori'] as ZoneId[], groups: ['cereal'] },
  { id: 'banana', name: 'Banana', water: 1100, nitrogen: -20, drought: 1, erosion: 3, zones: ['southwest','lake','central','western','rwenzori'] as ZoneId[], groups: ['perennial'] },
  { id: 'robusta', name: 'Coffee Robusta', water: 1200, nitrogen: -15, drought: 1, erosion: 2, zones: ['lake','central','rwenzori','western'] as ZoneId[], groups: ['perennial'] },
  { id: 'arabica', name: 'Coffee Arabica', water: 1300, nitrogen: -15, drought: 1, erosion: 2, zones: ['elgon','southwest'] as ZoneId[], groups: ['perennial'] },
] as const;
export type CropId = typeof CROPS[number]['id'];

export function recommend(zoneId: ZoneId, lastCropId: CropId, priority: Priority, rainTrend: 'declining'|'stable'|'increasing'|'unknown') {
  const zone = ZONES.find(z=>z.id===zoneId)!;
  const previous = CROPS.find(c=>c.id===lastCropId)!;
  const candidates = CROPS.filter(c => c.id !== lastCropId && c.zones.includes(zoneId));
  const scored = candidates.map(crop => {
    const waterSaving = Math.round(((previous.water - crop.water) / previous.water) * 100);
    const soilDifference = crop.nitrogen - previous.nitrogen;
    let score = 0;
    const reasons: string[] = [];
    if (priority === 'water') {
      score += Math.max(-30, Math.min(60, waterSaving)) + crop.drought * 8;
      reasons.push(waterSaving > 0 ? `Indicative water requirement is lower than ${previous.name} by ${waterSaving}%.` : `This crop has a higher indicative water requirement than ${previous.name}; compare local water availability before planting.`);
    } else if (priority === 'soil') {
      score += soilDifference + (crop.nitrogen > 0 ? 20 : 0);
      reasons.push(crop.nitrogen > 0 ? 'A legume-type crop can contribute nitrogen through biological fixation when well nodulated and managed.' : 'This option is not selected for a nitrogen-fixation benefit; consider soil testing and organic matter management.');
    } else if (priority === 'erosion') {
      score += crop.erosion * 18;
      reasons.push('The erosion score is a preliminary crop-cover proxy, not a measured slope-protection result. Use contouring, mulch and cover crops where appropriate.');
    } else {
      // Without verified district-level farmgate prices/costs, use a diversified-crop proxy rather than claiming profit.
      score += crop.drought * 8 + (crop.nitrogen > 0 ? 12 : 0) + (crop.water <= 400 ? 8 : 0);
      reasons.push('Ranked using resilience and soil-support proxies. Actual profitability requires local market prices, input costs and yield data.');
    }
    if (rainTrend === 'declining' && crop.drought >= 2) { score += 15; reasons.push('A drought-tolerant crop receives a bonus because you reported declining rainfall.'); }
    if (rainTrend === 'increasing' && crop.water >= 800) { score += 5; reasons.push('Higher water demand may be more feasible under an increasing-rainfall scenario, subject to drainage and flood risk.'); }
    if (zoneId === 'karamoja' && crop.drought === 3) { score += 20; reasons.push('Strong drought-tolerance fit for the Karamoja context.'); }
    if (['elgon','southwest'].includes(zoneId) && crop.erosion >= 2) { score += 8; reasons.push('Potentially useful ground-cover/erosion-management fit; slope management remains essential.'); }
    if (String(crop.groups[0]) === String(previous.groups[0]) && crop.groups[0] !== 'perennial') { score -= 18; reasons.push('Reduced ranking because repeating the same crop family can maintain pest and disease pressure.'); }
    if ((crop.groups as readonly string[]).includes('legume') && !(previous.groups as readonly string[]).includes('legume')) { score += 8; }
    return { crop, score, waterSaving, soilDifference, reasons };
  }).sort((a,b)=>b.score-a.score).slice(0,3);
  return { zone, previous, recommendations: scored };
}
