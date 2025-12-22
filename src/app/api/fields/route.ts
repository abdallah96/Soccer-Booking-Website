import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PETIT_CAMP_FIELD } from '@/lib/utils/constants';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Try to fetch from database first
    const { data: dbFields, error } = await supabase
      .from('fields')
      .select('*')
      .eq('name', 'Petit Camp');

    // If database has the field, use it; otherwise use constant
    if (dbFields && dbFields.length > 0) {
      return NextResponse.json({ 
        fields: dbFields.map(field => ({
          ...field,
          images: field.images || [],
        }))
      });
    }

    // Fallback to constant if database is empty
    return NextResponse.json({ 
      fields: [{
        ...PETIT_CAMP_FIELD,
        created_at: new Date().toISOString(),
      }]
    });
  } catch (error) {
    console.error('Fields fetch error:', error);
    // Fallback to constant on error
    return NextResponse.json({ 
      fields: [{
        ...PETIT_CAMP_FIELD,
        created_at: new Date().toISOString(),
      }]
    });
  }
}
