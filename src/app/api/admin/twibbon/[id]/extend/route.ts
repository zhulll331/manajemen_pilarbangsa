import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import {
  TwibbonHttpError,
  createTwibbonErrorResponse,
  requireTwibbonAdmin,
} from '@/lib/twibbon/server-service';

/**
 * Perpanjang (atau cabut perpanjangan) masa aktif kampanye Twibbon melewati batas kegiatan.
 * Body: { expected_version: number, extended_until: string (ISO) | null }
 * Hanya admin Humas/Ketua (requireTwibbonAdmin).
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await context.params;
    const { supabase, user } = await requireTwibbonAdmin();

    const body = await request.json().catch(() => ({}));
    const expectedVersion = Number(body.expected_version);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
      throw new TwibbonHttpError(
        422,
        'VALIDATION_FAILED',
        'Parameter expected_version wajib disertakan.'
      );
    }

    let extendedUntil: string | null = null;
    if (body.extended_until !== null && body.extended_until !== undefined) {
      const ms = Date.parse(String(body.extended_until));
      if (Number.isNaN(ms)) {
        throw new TwibbonHttpError(422, 'VALIDATION_FAILED', 'Format tanggal perpanjangan tidak valid.');
      }
      if (ms <= Date.now()) {
        throw new TwibbonHttpError(
          422,
          'VALIDATION_FAILED',
          'Batas perpanjangan harus berada di masa depan.'
        );
      }
      extendedUntil = new Date(ms).toISOString();
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
        'Ada perubahan dari admin lain. Muat versi terbaru sebelum mengubah.'
      );
    }

    const nextVersion = campaign.edit_version + 1;
    const { data: updated, error: updateErr } = await supabase
      .from('twibbon_campaigns')
      .update({
        extended_until: extendedUntil,
        edit_version: nextVersion,
        updated_by: user.id,
      })
      .eq('id', campaignId)
      .eq('edit_version', expectedVersion)
      .select('*')
      .maybeSingle();

    if (updateErr) {
      throw new TwibbonHttpError(
        500,
        'INTERNAL_ERROR',
        /extended_until/.test(updateErr.message)
          ? 'Kolom extended_until belum tersedia. Jalankan supabase_tahap18_twibbon_auto_close.sql terlebih dahulu.'
          : updateErr.message
      );
    }
    if (!updated) {
      throw new TwibbonHttpError(
        409,
        'VERSION_CONFLICT',
        'Ada perubahan dari admin lain. Muat versi terbaru sebelum mengubah.'
      );
    }

    await supabase.from('twibbon_audit_logs').insert({
      campaign_id: campaignId,
      actor_id: user.id,
      action: extendedUntil ? 'EXTEND_DEADLINE' : 'CLEAR_EXTENSION',
      revision_id: campaign.published_revision_id,
      summary: extendedUntil
        ? `Memperpanjang masa aktif twibbon "${campaign.slug}" hingga ${extendedUntil}.`
        : `Mencabut perpanjangan masa aktif twibbon "${campaign.slug}".`,
      changes: {
        previous_extended_until: campaign.extended_until ?? null,
        new_extended_until: extendedUntil,
        edit_version: nextVersion,
      },
    });

    revalidatePath('/twibbon');
    revalidatePath(`/twibbon/${campaign.slug}`);

    return NextResponse.json(
      { campaign: updated, edit_version: updated.edit_version },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    return createTwibbonErrorResponse(err);
  }
}

