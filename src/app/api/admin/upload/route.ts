import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/utils/rate-limit';

async function handlePost(request: AuthenticatedRequest) {
  try {
    // Rate limiting for uploads
    const identifier = getClientIdentifier(request);
    const rateLimit = checkRateLimit(`upload:${identifier}`, RATE_LIMITS.UPLOAD);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de téléchargements. Veuillez réessayer plus tard.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          },
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Le fichier est trop volumineux. Taille maximale: 5MB' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop();
    const fileName = `field-images/${timestamp}-${randomString}.${fileExt}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check if bucket exists first
    const { data: buckets, error: bucketCheckError } = await supabase.storage.listBuckets();
    
    if (bucketCheckError) {
      console.error('Bucket check error:', bucketCheckError);
      return NextResponse.json(
        { error: 'Erreur lors de la vérification du bucket' },
        { status: 500 }
      );
    }

    const bucketExists = buckets?.some(bucket => bucket.id === 'field-images');
    
    if (!bucketExists) {
      console.error('Bucket "field-images" does not exist');
      return NextResponse.json(
        { 
          error: 'Le bucket "field-images" n\'existe pas. Veuillez le créer dans Supabase Dashboard.',
          setupRequired: true,
          instructions: 'Go to Supabase Dashboard > Storage > New bucket. Name: field-images, Make it PUBLIC'
        },
        { status: 404 }
      );
    }

    const bucket = buckets?.find(b => b.id === 'field-images');
    if (bucket && !bucket.public) {
      console.error('Bucket "field-images" is not public');
      return NextResponse.json(
        { 
          error: 'Le bucket "field-images" n\'est pas public. Les images ne seront pas accessibles.',
          setupRequired: true,
          instructions: 'Go to Supabase Dashboard > Storage > field-images > Settings > Toggle "Public bucket" to ON'
        },
        { status: 403 }
      );
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('field-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      
      // Provide more helpful error messages
      if (error.message.includes('Bucket not found')) {
        return NextResponse.json(
          { 
            error: 'Le bucket "field-images" n\'existe pas. Veuillez le créer dans Supabase Dashboard.',
            setupRequired: true,
            instructions: 'Run: npx tsx scripts/setup-storage.ts or create manually in Supabase Dashboard'
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: `Erreur lors de l'upload: ${error.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('field-images')
      .getPublicUrl(fileName);

    return NextResponse.json({
      url: urlData.publicUrl,
      fileName: data.path,
      message: 'Image téléchargée avec succès',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload du fichier' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return requireAdmin(request, handlePost);
}

