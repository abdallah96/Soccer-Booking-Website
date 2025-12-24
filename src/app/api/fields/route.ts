import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PETIT_CAMP_FIELD } from '@/lib/utils/constants';
// Get data to field page
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
      // Ensure capacity is 18 (update if it's wrong)
      const field = dbFields[0];
      if (field.capacity !== 18) {
        await supabase
          .from('fields')
          .update({ capacity: 18 })
          .eq('name', 'Petit Camp');
        field.capacity = 18;
      }
      
      return NextResponse.json({
        fields: [{
          ...field,
          images: field.images || [],
        }]
      });
    }
    // Fallback to constant if database is empty
    return NextResponse.json({
      fields: [{
        ...PETIT_CAMP_FIELD,
        created_at: new Date().toISOString(),
      }],
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
