import { NextResponse } from 'next/server';
import { getParishes } from '@/lib/locations.server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const districtId = searchParams.get('districtId');
  if (!districtId) {
    return NextResponse.json({ error: 'districtId is required' }, { status: 400 });
  }
  try {
    const parishes = getParishes({
      districtId: Number(districtId),
      search: searchParams.get('search') || undefined,
    });
    return NextResponse.json({ parishes, count: parishes.length, districtId });
  } catch {
    return NextResponse.json({ error: 'Unable to load parishes' }, { status: 500 });
  }
}
