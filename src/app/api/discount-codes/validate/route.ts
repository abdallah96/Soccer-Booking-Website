import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { sanitizeString } from '@/lib/utils/sanitize';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Code requis' }, { status: 400 });
    }

    const sanitized = sanitizeString(code).toUpperCase().trim();
    if (!sanitized || sanitized.length < 4) {
      return NextResponse.json({ error: 'Code invalide' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data: discountCode, error } = await supabase
      .from('discount_codes')
      .select('*, user:users(id, name)')
      .eq('code', sanitized)
      .single();

    if (error || !discountCode) {
      return NextResponse.json({ valid: false, error: 'Code introuvable' }, { status: 404 });
    }

    if (discountCode.is_used) {
      return NextResponse.json({ valid: false, error: 'Ce code a déjà été utilisé' }, { status: 400 });
    }

    if (discountCode.expires_at && new Date(discountCode.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Ce code a expiré' }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      discount: {
        id: discountCode.id,
        code: discountCode.code,
        discount_type: discountCode.discount_type,
        discount_value: discountCode.discount_value,
        user_id: discountCode.user_id,
        user_name: discountCode.user?.name,
      },
    });
  } catch (error) {
    console.error('Discount code validation error:', error);
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}
