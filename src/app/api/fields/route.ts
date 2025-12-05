import { NextResponse } from 'next/server';
import { SAMPLE_FIELDS } from '@/lib/utils/constants';

// Mock database - in production, fetch from Supabase
const fields = SAMPLE_FIELDS.map((field, index) => ({
  id: String(index + 1),
  ...field,
  images: field.images || [],
  created_at: new Date().toISOString(),
}));

export async function GET() {
  try {
    return NextResponse.json({
      fields,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch fields' },
      { status: 500 }
    );
  }
}
