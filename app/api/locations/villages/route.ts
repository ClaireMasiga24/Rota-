import { NextResponse } from 'next/server';
import { getVillages } from '@/lib/locations.server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parishId = searchParams.get('parishId');
  if (!parishId) {
    return NextResponse.json({ error: 'parishId is required' }, { status: 400 });
  }
  try {
    const villages = getVillages({
      parishId: Number(parishId),
      search: searchParams.get('search') || undefined,
    });
    return NextResponse.json({ villages, count: villages.length, parishId });
  } catch {
    return NextResponse.json({ error: 'Unable to load villages' }, { status: 500 });
  }
}
