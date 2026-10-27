import { NextRequest, NextResponse } from 'next/server';
import {
  createTwibbonErrorResponse,
  fetchPublicTwibbonCampaignList,
} from '@/lib/twibbon/server-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = Number(searchParams.get('limit') || '12');
    const rawOffset = Number(searchParams.get('offset') || '0');

    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, rawLimit), 50) : 12;
    const offset = Number.isFinite(rawOffset) ? Math.max(0, rawOffset) : 0;

    const campaigns = await fetchPublicTwibbonCampaignList(limit, offset);

    return NextResponse.json(
      {
        campaigns,
        pagination: {
          limit,
          offset,
          count: campaigns.length,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (err) {
    return createTwibbonErrorResponse(err);
  }
}

