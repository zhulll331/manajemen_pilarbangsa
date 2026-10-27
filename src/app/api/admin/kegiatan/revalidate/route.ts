import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  requireTwibbonAdmin,
  createTwibbonErrorResponse,
} from '@/lib/twibbon/server-service';

export async function POST(request: NextRequest) {
  try {
    await requireTwibbonAdmin();

    let slug: string | null = null;
    try {
      const body = await request.json();
      if (body && typeof body.slug === 'string') {
        slug = body.slug.trim();
      }
    } catch {
      // Abaikan jika body kosong
    }

    revalidatePath('/');
    revalidatePath('/kegiatan');
    revalidatePath('/twibbon');
    if (slug) {
      revalidatePath(`/kegiatan/${slug}`);
    }

    return NextResponse.json({ revalidated: true });
  } catch (err) {
    return createTwibbonErrorResponse(err);
  }
}
