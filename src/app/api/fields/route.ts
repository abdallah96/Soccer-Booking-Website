import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PETIT_CAMP_FIELD } from '@/lib/utils/constants';

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
      // Ensure Petit Camp has capacity 18 (update if wrong)
      const petitCampField = dbFields.find(f => f.name === 'Petit Camp');
      if (petitCampField && petitCampField.capacity !== 18) {
        await supabase
          .from('fields')
          .update({ capacity: 18 })
          .eq('name', 'Petit Camp');
        petitCampField.capacity = 18;
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
