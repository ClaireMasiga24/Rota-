/**
 * ROTA - the ten agro-ecological zones used for rotation recommendations.
 *
 * Static, typed reference data - no network calls. annualRainfallMm is the
 * typical annual rainfall in millimetres where a project-provided figure
 * exists; lat/lon is a representative coordinate for the zone used to feed
 * the live NASA POWER call. flags describe the climate context the
 * recommendations draw on.
 */

export const ZONES = [
  { id: 'central', name: 'Central Buganda', places: 'Kampala, Wakiso, Mpigi', context: 'Changing rainfall timing and pressure on cultivated soils', lat: 0.3476, lon: 32.5825, annualRainfallMm: 1200, flags: ['Variable rainfall', 'Soil depletion'] },
  { id: 'eastern', name: 'Eastern Mbale', places: 'Mbale, Bududa, Tororo', context: 'Mixed rainfall conditions; steep terrain in some locations', lat: 1.0792, lon: 34.1791, annualRainfallMm: 1400, flags: ['Runoff risk', 'Season variability'] },
  { id: 'northern', name: 'Northern Gulu', places: 'Gulu, Lira, Kitgum', context: 'Seasonal dry spells and heat stress', lat: 2.7822, lon: 32.2988, annualRainfallMm: 1200, flags: ['Dry spells', 'Heat stress'] },
  { id: 'westnile', name: 'West Nile Arua', places: 'Arua, Moyo, Yumbe', context: 'Dry spells and variable soil conditions', lat: 3.0265, lon: 30.9039, annualRainfallMm: 1300, flags: ['Dry spells', 'Soil variability'] },
  { id: 'western', name: 'Western Hoima', places: 'Hoima, Masindi, Buliisa', context: 'Mixed farming systems and land-use pressure', lat: 1.4319, lon: 31.3525, annualRainfallMm: 1200, flags: ['Land-use pressure'] },
  { id: 'southwest', name: 'Southwest Mbarara', places: 'Mbarara, Kabale, Ntungamo', context: 'Highland and rangeland farming conditions vary by location', lat: -0.6084, lon: 30.6552, annualRainfallMm: 1000, flags: ['Slope-sensitive', 'Variable temperatures'] },
  { id: 'karamoja', name: 'Karamoja Moroto', places: 'Moroto, Kotido, Napak', context: 'Water scarcity and high drought exposure', lat: 2.5341, lon: 34.6585, annualRainfallMm: 300, flags: ['Water stress', 'Drought risk'] },
  { id: 'elgon', name: 'Elgon Kapchorwa', places: 'Kapchorwa, Sironko, Bulambuli', context: 'Steep slopes and intense rainfall can increase erosion and landslide risk', lat: 1.3642, lon: 34.3520, annualRainfallMm: 1400, flags: ['Erosion risk', 'Slope-sensitive'] },
  { id: 'rwenzori', name: 'Rwenzori Kasese', places: 'Kasese, Bundibugyo, Ntoroko', context: 'Mountain and lowland conditions differ; manage runoff and local flood risk', lat: 0.1762, lon: 30.0918, annualRainfallMm: 1300, flags: ['Runoff risk', 'Flood exposure'] },
  { id: 'lake', name: 'Lake Masaka', places: 'Masaka, Rakai, Kalungu', context: 'Relatively wet Lake Victoria-influenced farming environment', lat: -0.3333, lon: 31.7333, annualRainfallMm: 1200, flags: ['High rainfall context'] },
] as const;

export type ZoneId = typeof ZONES[number]['id'];
