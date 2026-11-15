/**
 * ROTA - server-side data access for the real UBOS Uganda administrative
 * datasets (lib/data/districts.csv, parishes.csv, villages.csv).
 *
 * The three files are read, parsed and cached in memory once. Subsequent
 * requests are served from the cache, so the dataset is never re-read or
 * re-parsed per request. Only API route handlers (server-side) should import
 * this module - client components must call the /api/locations routes instead.
 */

import fs from 'fs';
import path from 'path';
import type { District, Parish, Village, LocationContext } from './locations';

const DATA_DIR = path.join(process.cwd(), 'lib', 'data');

interface CsvRow {
  [key: string]: string;
}

/**
 * Minimal RFC 4180 CSV parser: handles quoted fields, embedded commas,
 * embedded newlines and doubled quotes ("").
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
      } else {
        field += ch;
      }
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ',') {
      cur.push(field);
      field = '';
      i++;
      continue;
    }
    if (ch === '\r') {
      i++;
      if (text[i] === '\n') i++;
      cur.push(field);
      field = '';
      rows.push(cur);
      cur = [];
      continue;
    }
    if (ch === '\n') {
      cur.push(field);
      field = '';
      rows.push(cur);
      cur = [];
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field !== '' || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  return rows;
}

function toObjects(rows: string[][]): CsvRow[] {
  const header = rows[0];
  const objects: CsvRow[] = [];
  for (let r = 1; r < rows.length; r++) {
    const obj: CsvRow = {};
    for (let c = 0; c < header.length; c++) {
      obj[header[c]] = rows[r][c] === undefined ? '' : rows[r][c];
    }
    objects.push(obj);
  }
  return objects;
}

function readCsv(name: string): CsvRow[] {
  const text = fs.readFileSync(path.join(DATA_DIR, name), 'utf8');
  return toObjects(parseCsv(text));
}

function toNumber(value: string): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

interface RawData {
  districts: CsvRow[];
  parishes: CsvRow[];
  villages: CsvRow[];
}

let cache: {
  districts: District[];
  parishes: Parish[];
  villages: Village[];
} | null = null;

function loadData(): { districts: District[]; parishes: Parish[]; villages: Village[] } {
  if (cache) return cache;

  const districts = readCsv('districts.csv').map((r): District => ({
    id: Number(r.id),
    name: r.name,
    slug: r.slug,
    ubosCode: r.ubosCode,
    region: r['path.regions.slug'],
    regionName: r['path.regions.name'],
    subRegion: r['path.sub-regions.slug'],
    subRegionName: r['path.sub-regions.name'],
    lat: toNumber(r['centroid.lat']),
    lng: toNumber(r['centroid.lng']),
  }));

  const parishes = readCsv('parishes.csv').map((r): Parish => ({
    id: Number(r.id),
    name: r.name,
    slug: r.slug,
    ubosCode: r.ubosCode,
    districtId: Number(r['path.districts.id']),
    districtName: r['path.districts.name'],
    countyName: r['path.counties.name'] || undefined,
    subCountyName: r['path.sub-counties.name'] || undefined,
    ruralUrban: r.ruralUrban || undefined,
    lat: toNumber(r['centroid.lat']),
    lng: toNumber(r['centroid.lng']),
  }));

  const villages = readCsv('villages.csv').map((r): Village => ({
    id: Number(r.id),
    name: r.name,
    slug: r.slug,
    ubosCode: r.ubosCode,
    districtId: Number(r['path.districts.id']),
    parishId: Number(r['path.parishes.id']),
    subCountyId: toNumber(r['path.sub-counties.id']),
    hhCodePrefix: r.hhCodePrefix || undefined,
  }));

  cache = { districts, parishes, villages };
  return cache;
}

function matches(value: string, search: string | undefined): boolean {
  if (!search) return true;
  return value.toLowerCase().includes(search.toLowerCase().trim());
}

export function getDistricts({ search }: { search?: string }): District[] {
  return loadData().districts.filter(d => matches(d.name, search));
}

export function getParishes({ districtId, search }: { districtId: number; search?: string }): Parish[] {
  return loadData().parishes.filter(p => p.districtId === districtId && matches(p.name, search));
}

export function getVillages({ parishId, search }: { parishId: number; search?: string }): Village[] {
  return loadData().villages.filter(v => v.parishId === parishId && matches(v.name, search));
}

export function getDistrict(id: number): District | undefined {
  return loadData().districts.find(d => d.id === id);
}

export function getParish(id: number): Parish | undefined {
  return loadData().parishes.find(p => p.id === id);
}

export function getVillage(id: number): Village | undefined {
  return loadData().villages.find(v => v.id === id);
}

export function getLocationContext(
  districtId: number,
  parishId: number,
  villageId: number,
): LocationContext | null {
  const { districts, parishes, villages } = loadData();
  const district = districts.find(d => d.id === districtId);
  const parish = parishes.find(p => p.id === parishId && p.districtId === districtId);
  const village = villages.find(v => v.id === villageId && v.parishId === parishId && v.districtId === districtId);
  if (!district || !parish || !village) return null;
  return { district, parish, village };
}

export interface ValidationReport {
  generatedAt: string;
  districts: {
    loaded: number;
    duplicateIds: number[];
    missingName: number;
    missingCentroid: number;
  };
  parishes: {
    loaded: number;
    duplicateIds: number[];
    missingName: number;
    missingParentDistrict: number;
    unmatchedParentDistrict: { id: number; name: string; districtId: string }[];
    missingCentroid: number;
  };
  villages: {
    loaded: number;
    duplicateIds: number[];
    missingName: number;
    missingParentDistrict: number;
    missingParentParish: number;
    unmatchedParentDistrict: number[];
    unmatchedParentParish: { village: string; districtId: string; parishId: string }[];
    missingCoordinates: number;
  };
  duplicateNamesWithinParish: number;
  sampleDuplicateNames: string[];
}

export function getValidationReport(): ValidationReport {
  const { districts, parishes, villages } = loadData();

  const duplicateIds = <T extends { id: number }>(items: T[]): number[] => {
    const counts = new Map<number, number>();
    for (const item of items) counts.set(item.id, (counts.get(item.id) || 0) + 1);
    return [...counts.entries()].filter(([, c]) => c > 1).map(([id]) => id);
  };

  const districtIds = new Set(districts.map(d => d.id));
  const parishIds = new Set(parishes.map(p => p.id));
  const parishById = new Map(parishes.map(p => [p.id, p]));

  const unmatchedParentDistrictParishes = parishes.filter(p => !districtIds.has(p.districtId));
  const unmatchedParentDistrictVillages = villages.filter(v => !districtIds.has(v.districtId));
  const unmatchedParentParishVillages = villages.filter(
    v => v.districtId && !parishIds.has(v.parishId),
  );

  // Village's stated district must agree with its parish's district.
  const inconsistentParishDistrict = villages.filter(v => {
    const p = parishById.get(v.parishId);
    return Boolean(p && p.districtId !== v.districtId);
  });

  const namesWithinParish = new Map<string, number>();
  for (const v of villages) {
    const key = `${v.districtId}|${v.parishId}|${v.name}`;
    namesWithinParish.set(key, (namesWithinParish.get(key) || 0) + 1);
  }
  const dupNames = [...namesWithinParish.entries()].filter(([, c]) => c > 1);

  return {
    generatedAt: new Date().toISOString(),
    districts: {
      loaded: districts.length,
      duplicateIds: duplicateIds(districts),
      missingName: districts.filter(d => !d.name).length,
      missingCentroid: districts.filter(d => d.lat === undefined || d.lng === undefined).length,
    },
    parishes: {
      loaded: parishes.length,
      duplicateIds: duplicateIds(parishes),
      missingName: parishes.filter(p => !p.name).length,
      missingParentDistrict: parishes.filter(p => !p.districtId).length,
      unmatchedParentDistrict: unmatchedParentDistrictParishes.map(p => ({
        id: p.id,
        name: p.name,
        districtId: String(p.districtId),
      })),
      missingCentroid: parishes.filter(p => p.lat === undefined || p.lng === undefined).length,
    },
    villages: {
      loaded: villages.length,
      duplicateIds: duplicateIds(villages),
      missingName: villages.filter(v => !v.name).length,
      missingParentDistrict: villages.filter(v => !v.districtId).length,
      missingParentParish: villages.filter(v => !v.parishId).length,
      unmatchedParentDistrict: unmatchedParentDistrictVillages.map(v => v.id),
      unmatchedParentParish: unmatchedParentParishVillages.map(v => ({
        village: v.name,
        districtId: String(v.districtId),
        parishId: String(v.parishId),
      })),
      missingCoordinates: villages.length, // centroid/bbox/areaKm2 are not present at village level
    },
    duplicateNamesWithinParish: dupNames.length,
    sampleDuplicateNames: dupNames.slice(0, 10).map(([key]) => key.split('|')[2]),
  };
}
