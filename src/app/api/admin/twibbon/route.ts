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
import { validateAdminCampaignFields } from '@/lib/twibbon/validation';

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await requireTwibbonAdmin();
    const body = await request.json().catch(() => ({}));

    const title = String(body.title || '').trim();
    const slug = String(body.slug || '').trim().toLowerCase();
    const description = String(body.description || '').trim();
    const eventId = body.event_id ? String(body.event_id).trim() : null;
    const captionDefault = String(
      body.caption_default ?? DEFAULT_DIKLAT_CAPTION_UMUM
    ).trim();
    const captionTemplate = String(
      body.caption_template ?? DEFAULT_DIKLAT_CAPTION_PERSONAL
    ).trim();

    const fieldCheck = validateAdminCampaignFields({
      title,
      slug,
      description,
      captionDefault,
      captionTemplate,
      requireReadyForPublish: false,
      hasValidFrame: false,
    });

    if (!fieldCheck.valid) {
      throw new TwibbonHttpError(422, 'VALIDATION_FAILED', fieldCheck.errors[0], {
        errors: fieldCheck.errors,
      });
    }

    const draftPayload = {
      title,
      description,
      frame_asset_id: null,
      thumbnail_asset_id: null,
      caption_default: captionDefault,
      caption_template: captionTemplate,
    };

    const { data: created, error: insertError } = await supabase
      .from('twibbon_campaigns')
      .insert({
        slug,
        slug_locked: false,
        event_id: eventId || null,
        state: 'draft',
        draft_payload: draftPayload,
        edit_version: 1,
        created_by: user.id,
        updated_by: user.id,
      })
      .select('*')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        throw new TwibbonHttpError(
          422,
          'VALIDATION_FAILED',
          'Slug kampanye sudah digunakan oleh kampanye lain. Gunakan slug yang unik.'
        );
      }
      throw new TwibbonHttpError(
        500,
        'INTERNAL_ERROR',
        `Gagal membuat draft kampanye: ${insertError.message}`
      );
    }

    await supabase.from('twibbon_audit_logs').insert({
      campaign_id: created.id,
      actor_id: user.id,
      action: 'CREATE_DRAFT',
      summary: `Membuat draft kampanye Twibbon "${title}" (/twibbon/${slug})`,
      changes: { slug, event_id: eventId },
    });

    return NextResponse.json(
      {
        campaign: created,
        edit_version: created.edit_version,
      },
      {
        status: 201,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (err) {
    return createTwibbonErrorResponse(err);
  }
}

