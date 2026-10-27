import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import {
  TwibbonHttpError,
  createTwibbonErrorResponse,
  requireTwibbonAdmin,
} from '@/lib/twibbon/server-service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await context.params;
    const { supabase, user } = await requireTwibbonAdmin();

    const body = await request.json().catch(() => ({}));
    const expectedVersion = Number(body.expected_version);
    const action = body.action === 'restore' ? 'restore' : 'archive';

    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
      throw new TwibbonHttpError(
        422,
        'VALIDATION_FAILED',
        'Parameter expected_version wajib disertakan.'
      );
    }

    const { data: campaign, error: campErr } = await supabase
      .from('twibbon_campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle();

    if (campErr || !campaign) {
      throw new TwibbonHttpError(404, 'CAMPAIGN_NOT_FOUND', 'Kampanye tidak ditemukan.');
    }

    if (campaign.edit_version !== expectedVersion) {
      throw new TwibbonHttpError(
        409,
        'VERSION_CONFLICT',
        'Ada perubahan dari admin lain. Muat versi terbaru sebelum mengubah status.'
      );
    }

    if (action === 'restore' && !campaign.published_revision_id) {
      throw new TwibbonHttpError(
        422,
        'VALIDATION_FAILED',
        'Kampanye belum pernah memiliki revisi terbit dan tidak dapat dipulihkan langsung.'
      );
    }

    const targetState = action === 'restore' ? 'published' : 'archived';
    const nextVersion = campaign.edit_version + 1;

    const { data: updated, error: updateErr } = await supabase
      .from('twibbon_campaigns')
      .update({
        state: targetState,
        edit_version: nextVersion,
        updated_by: user.id,
        archived_at: targetState === 'archived' ? new Date().toISOString() : null,
      })
      .eq('id', campaignId)
      .eq('edit_version', expectedVersion)
      .select('*')
      .maybeSingle();

    if (updateErr) {
      throw new TwibbonHttpError(500, 'INTERNAL_ERROR', updateErr.message);
    }

    if (!updated) {
      throw new TwibbonHttpError(
        409,
        'VERSION_CONFLICT',
        'Ada perubahan dari admin lain. Muat versi terbaru sebelum mengubah status.'
      );
    }

    await supabase.from('twibbon_audit_logs').insert({
      campaign_id: campaignId,
      actor_id: user.id,
      action: action === 'restore' ? 'RESTORE_PUBLISHED' : 'ARCHIVE',
      revision_id: campaign.published_revision_id,
      summary:
        action === 'restore'
          ? `Memulihkan status kampanye "${campaign.slug}" kembali ke Terbit (Published).`
          : `Mengarsipkan kampanye "${campaign.slug}".`,
      changes: {
        previous_state: campaign.state,
        new_state: targetState,
        edit_version: nextVersion,
      },
    });

    revalidatePath('/twibbon');
    revalidatePath(`/twibbon/${campaign.slug}`);

    return NextResponse.json(
      {
        campaign: updated,
        state: updated.state,
        edit_version: updated.edit_version,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    return createTwibbonErrorResponse(err);
  }
}

