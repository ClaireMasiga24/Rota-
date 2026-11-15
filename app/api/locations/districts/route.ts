import { NextResponse } from 'next/server';
import { getDistricts } from '@/lib/locations.server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    const districts = getDistricts({ search: searchParams.get('search') || undefined });
    return NextResponse.json({ districts, count: districts.length });
  } catch {
    return NextResponse.json({ error: 'Unable to load districts' }, { status: 500 });
  }
}
