import { NextResponse } from 'next/server';
import { getValidationReport } from '@/lib/locations.server';

export async function GET() {
  try {
    return NextResponse.json(getValidationReport());
  } catch {
    return NextResponse.json({ error: 'Unable to generate validation report' }, { status: 500 });
  }
}
