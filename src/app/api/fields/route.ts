import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PETIT_CAMP_FIELD } from '@/lib/utils/constants';
import { FIELD_CONFIG } from '@/lib/config/constants';

// Get all fields for users
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Fetch ALL fields from database
    const { data: dbFields, error } = await supabase
      .from('fields')
      .select('*')
      .order('created_at', { ascending: false });

    // If database has fields, return them
    if (dbFields && dbFields.length > 0) {
      // Ensure Petit Camp has correct capacity (update if wrong)
      const petitCampField = dbFields.find(f => f.name === FIELD_CONFIG.PETIT_CAMP_NAME);
      if (petitCampField && petitCampField.capacity !== FIELD_CONFIG.PETIT_CAMP_CAPACITY) {
        await supabase
          .from('fields')
          .update({ capacity: FIELD_CONFIG.PETIT_CAMP_CAPACITY })
          .eq('name', FIELD_CONFIG.PETIT_CAMP_NAME);
        petitCampField.capacity = FIELD_CONFIG.PETIT_CAMP_CAPACITY;
      }
      
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
