import { NextRequest, NextResponse } from 'next/server';
import {
  TwibbonHttpError,
  createTwibbonErrorResponse,
  requireTwibbonAdmin,
} from '@/lib/twibbon/server-service';
import { validateAdminCampaignFields } from '@/lib/twibbon/validation';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { supabase, user } = await requireTwibbonAdmin();
    const body = await request.json().catch(() => ({}));

    const expectedVersion = Number(body.expected_version);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
      throw new TwibbonHttpError(
        422,
        'VALIDATION_FAILED',
        'Parameter expected_version wajib disertakan untuk mencegah konflik edit.'
      );
    }

    const { data: current, error: fetchError } = await supabase
      .from('twibbon_campaigns')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !current) {
      throw new TwibbonHttpError(404, 'CAMPAIGN_NOT_FOUND', 'Kampanye tidak ditemukan.');
    }

    if (current.edit_version !== expectedVersion) {
      throw new TwibbonHttpError(
        409,
        'VERSION_CONFLICT',
        'Ada perubahan dari admin lain. Muat versi terbaru sebelum menyimpan.'
      );
    }

    const existingPayload = (current.draft_payload || {}) as Record<string, unknown>;
    const title = String(body.title ?? existingPayload.title ?? '').trim();
    const slug = current.slug_locked
      ? String(current.slug)
      : String(body.slug ?? current.slug ?? '').trim().toLowerCase();
    const description = String(body.description ?? existingPayload.description ?? '').trim();
    const eventId =
      body.event_id !== undefined
        ? body.event_id
          ? String(body.event_id).trim()
          : null
        : current.event_id;
    const frameAssetId =
      body.frame_asset_id !== undefined
        ? body.frame_asset_id
          ? String(body.frame_asset_id)
          : null
        : (existingPayload.frame_asset_id as string | null) ?? null;
    const thumbnailAssetId =
      body.thumbnail_asset_id !== undefined
        ? body.thumbnail_asset_id
          ? String(body.thumbnail_asset_id)
          : null
        : (existingPayload.thumbnail_asset_id as string | null) ?? null;
    const captionDefault = String(
      body.caption_default ?? existingPayload.caption_default ?? ''
    ).trim();
    const captionTemplate = String(
      body.caption_template ?? existingPayload.caption_template ?? ''
    ).trim();

    if (
      current.slug_locked &&
      body.slug &&
      String(body.slug).trim().toLowerCase() !== current.slug.toLowerCase()
    ) {
      throw new TwibbonHttpError(
        422,
        'VALIDATION_FAILED',
        'Slug kampanye yang sudah pernah diterbitkan terkunci dan tidak dapat diubah.'
      );
    }

    const fieldCheck = validateAdminCampaignFields({
      title,
      slug,
      description,
      captionDefault,
      captionTemplate,
      requireReadyForPublish: false,
      hasValidFrame: Boolean(frameAssetId),
    });

    if (!fieldCheck.valid) {
      throw new TwibbonHttpError(422, 'VALIDATION_FAILED', fieldCheck.errors[0], {
        errors: fieldCheck.errors,
      });
    }

    const nextPayload = {
      title,
      description,
      frame_asset_id: frameAssetId,
      thumbnail_asset_id: thumbnailAssetId,
      caption_default: captionDefault,
      caption_template: captionTemplate,
    };

    const nextVersion = current.edit_version + 1;

    const { data: updated, error: updateError } = await supabase
      .from('twibbon_campaigns')
      .update({
        slug,
        event_id: eventId,
        draft_payload: nextPayload,
        edit_version: nextVersion,
        updated_by: user.id,
      })
      .eq('id', id)
      .eq('edit_version', expectedVersion)
      .select('*')
      .maybeSingle();

    if (updateError) {
      if (updateError.code === '23505') {
        throw new TwibbonHttpError(
          422,
          'VALIDATION_FAILED',
          'Slug kampanye sudah digunakan oleh kampanye lain.'
        );
      }
      throw new TwibbonHttpError(500, 'INTERNAL_ERROR', updateError.message);
    }

    if (!updated) {
      throw new TwibbonHttpError(
        409,
        'VERSION_CONFLICT',
        'Ada perubahan dari admin lain. Muat versi terbaru sebelum menyimpan.'
      );
    }

    await supabase.from('twibbon_audit_logs').insert({
      campaign_id: id,
      actor_id: user.id,
      action: 'SAVE_DRAFT',
      summary: `Menyimpan perubahan draft "${title}" (versi edit #${nextVersion})`,
      changes: {
        edit_version: nextVersion,
        slug,
        event_id: eventId,
        frame_asset_id: frameAssetId,
      },
    });

    return NextResponse.json(
      {
        campaign: updated,
        edit_version: updated.edit_version,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (err) {
    return createTwibbonErrorResponse(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { supabase } = await requireTwibbonAdmin();

    const { data: campaign, error: fetchError } = await supabase
      .from('twibbon_campaigns')
      .select('id, state, published_revision_id, slug_locked')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !campaign) {
      throw new TwibbonHttpError(404, 'CAMPAIGN_NOT_FOUND', 'Kampanye tidak ditemukan.');
    }

    if (
      campaign.state !== 'draft' ||
      campaign.published_revision_id !== null ||
      campaign.slug_locked
    ) {
      throw new TwibbonHttpError(
        422,
        'VALIDATION_FAILED',
        'Kampanye yang sudah pernah diterbitkan tidak dapat dihapus secara permanen. Gunakan fitur Arsip.'
      );
    }

    // Bersihkan file di bucket twibbon-drafts
    const { data: assets } = await supabase
      .from('twibbon_assets')
      .select('bucket_id, storage_path')
      .eq('campaign_id', id);

    if (Array.isArray(assets) && assets.length > 0) {
      const draftPaths = assets
        .filter((a) => a.bucket_id === 'twibbon-drafts' && a.storage_path)
        .map((a) => a.storage_path);
      if (draftPaths.length > 0) {
        await supabase.storage.from('twibbon-drafts').remove(draftPaths);
      }
    }

    const { error: delError } = await supabase
      .from('twibbon_campaigns')
      .delete()
      .eq('id', id)
      .eq('state', 'draft');

    if (delError) {
      throw new TwibbonHttpError(500, 'INTERNAL_ERROR', delError.message);
    }

    return NextResponse.json(
      { deleted: true, id },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    return createTwibbonErrorResponse(err);
  }
}

