import { NextRequest, NextResponse } from 'next/server';
import {
  TwibbonHttpError,
  createTwibbonErrorResponse,
  requireTwibbonAdmin,
} from '@/lib/twibbon/server-service';
import {
  DEFAULT_DIKLAT_CAPTION_PERSONAL,
  DEFAULT_DIKLAT_CAPTION_UMUM,
} from '@/lib/twibbon/caption';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await context.params;
    const { supabase } = await requireTwibbonAdmin();

    const { data: campaign, error: campErr } = await supabase
      .from('twibbon_campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle();

    if (campErr || !campaign) {
      throw new TwibbonHttpError(404, 'CAMPAIGN_NOT_FOUND', 'Kampanye tidak ditemukan.');
    }

    const payload = (campaign.draft_payload || {}) as Record<string, unknown>;
    const frameAssetId = payload.frame_asset_id ? String(payload.frame_asset_id) : null;
    const thumbnailAssetId = payload.thumbnail_asset_id
      ? String(payload.thumbnail_asset_id)
      : null;

    let framePreviewUrl = 'builtin:diklat-kepemimpinan-2026';
    if (frameAssetId) {
      const { data: frameAsset } = await supabase
        .from('twibbon_assets')
        .select('*')
        .eq('id', frameAssetId)
        .eq('campaign_id', campaignId)
        .maybeSingle();

      if (frameAsset) {
        if (frameAsset.public_url) {
          framePreviewUrl = frameAsset.public_url;
        } else {
          const { data: signed } = await supabase.storage
            .from(frameAsset.bucket_id)
            .createSignedUrl(frameAsset.storage_path, 300);
          if (signed?.signedUrl) {
            framePreviewUrl = signed.signedUrl;
          }
        }
      }
    }

    let thumbnailPreviewUrl: string | null = null;
    if (thumbnailAssetId) {
      const { data: thumbAsset } = await supabase
        .from('twibbon_assets')
        .select('*')
        .eq('id', thumbnailAssetId)
        .eq('campaign_id', campaignId)
        .maybeSingle();

      if (thumbAsset) {
        if (thumbAsset.public_url) {
          thumbnailPreviewUrl = thumbAsset.public_url;
        } else {
          const { data: signed } = await supabase.storage
            .from(thumbAsset.bucket_id)
            .createSignedUrl(thumbAsset.storage_path, 300);
          if (signed?.signedUrl) {
            thumbnailPreviewUrl = signed.signedUrl;
          }
        }
      }
    }

    let eventInfo = null;
    if (campaign.event_id) {
      const { data: ev } = await supabase
        .from('public_events')
        .select('id, title, slug, starts_at, ends_at, location, registration_status')
        .eq('id', campaign.event_id)
        .maybeSingle();
      if (ev) {
        eventInfo = {
          id: ev.id,
          title: ev.title,
          slug: ev.slug,
          date: ev.starts_at ? String(ev.starts_at).slice(0, 10) : null,
          starts_at: ev.starts_at,
          ends_at: ev.ends_at,
          location: ev.location,
          timezone: 'Asia/Jakarta' as const,
          url: `/kegiatan/${ev.slug}`,
          registration_status: ev.registration_status,
        };
      }
    }

    return NextResponse.json(
      {
        preview: {
          id: campaign.id,
          slug: campaign.slug,
          state: 'published' as const,
          can_generate: true,
          revision_id: campaign.published_revision_id || 'draft-preview',
          revision_number: 0,
          title: String(payload.title || 'Draft Kampanye Twibbon'),
          description: payload.description ? String(payload.description) : null,
          frame: {
            url: framePreviewUrl,
            width: 1080 as const,
            height: 1080 as const,
          },
          thumbnail_url: thumbnailPreviewUrl,
          caption_default: String(
            payload.caption_default || DEFAULT_DIKLAT_CAPTION_UMUM
          ),
          caption_template: String(
            payload.caption_template || DEFAULT_DIKLAT_CAPTION_PERSONAL
          ),
          published_at: campaign.published_at || campaign.updated_at,
          archived_at: campaign.archived_at,
          event: eventInfo,
        },
        campaign,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      }
    );
  } catch (err) {
    return createTwibbonErrorResponse(err);
  }
}

