import { NextRequest, NextResponse } from 'next/server';
import {
  TwibbonHttpError,
  createTwibbonErrorResponse,
  fetchPublicTwibbonCampaignBySlug,
} from '@/lib/twibbon/server-service';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const campaign = await fetchPublicTwibbonCampaignBySlug(slug);

    if (!campaign) {
      throw new TwibbonHttpError(
        404,
        'CAMPAIGN_NOT_FOUND',
        'Twibbon ini belum tersedia. Kembali ke daftar twibbon.'
      );
    }

    return NextResponse.json(campaign, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (err) {
    return createTwibbonErrorResponse(err);
  }
}

