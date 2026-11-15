/**
 * ROTA - Ugandan administrative location types and pure helpers.
 *
 * This module imports nothing from 'fs', so it is safe to import from client
 * components. All filesystem-backed data access lives in lib/locations.server.ts.
 */

import type { ZoneId } from './rota';

export interface FarmLocation {
  districtId: number;
  district: string;
  parishId: number;
  parish: string;
  villageId: number;
  village: string;
}

export interface District {
  id: number;
  name: string;
  slug: string;
  ubosCode: string;
  region: string;
  regionName: string;
  subRegion: string;
  subRegionName: string;
  lat?: number;
  lng?: number;
}

export interface Parish {
  id: number;
  name: string;
  slug: string;
  ubosCode: string;
  districtId: number;
  districtName: string;
  countyName?: string;
  subCountyName?: string;
  ruralUrban?: string;
  lat?: number;
  lng?: number;
}

export interface Village {
  id: number;
  name: string;
  slug: string;
  ubosCode: string;
  districtId: number;
  parishId: number;
  subCountyId?: number;
  hhCodePrefix?: string;
}

export interface LocationContext {
  district: District;
  parish: Parish;
  village: Village;
}

/**
 * Maps a real administrative district to the prototype recommendation zone.
 * Derived from each district's observed `path.sub-regions.slug` value in the
 * UBOS dataset. This is a prototype grouping only - it does not imply that
 * village-level agronomic data exists for the selected location.
 */
const SUBREGION_TO_ZONE: Record<string, ZoneId> = {
  'buganda-north': 'central',
  'buganda-south': 'central',
  'greater-kampala': 'central',
  busoga: 'eastern',
  bukedi: 'eastern',
  teso: 'eastern',
  acholi: 'northern',
  lango: 'northern',
  ankole: 'western',
  bunyoro: 'western',
  kigezi: 'southwest',
  karamoja: 'karamoja',
  elgon: 'elgon',
  rwenzori: 'rwenzori',
  'west-nile': 'westnile',
};

export function districtToZoneId(district: District): ZoneId {
  return SUBREGION_TO_ZONE[district.subRegion] ?? 'central';
}

export function locationToFarmLocation(ctx: LocationContext): FarmLocation {
  return {
    districtId: ctx.district.id,
    district: ctx.district.name,
    parishId: ctx.parish.id,
    parish: ctx.parish.name,
    villageId: ctx.village.id,
    village: ctx.village.name,
  };
}
