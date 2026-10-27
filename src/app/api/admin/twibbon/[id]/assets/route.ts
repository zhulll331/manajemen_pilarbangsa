import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  TwibbonHttpError,
  createTwibbonErrorResponse,
  requireTwibbonAdmin,
} from '@/lib/twibbon/server-service';
import { validateAdminFramePngOnServer } from '@/lib/twibbon/server-png-validator';
import { parseImageHeader } from '@/lib/twibbon/exif';
import { ADMIN_FRAME_MAX_BYTES } from '@/lib/twibbon/validation';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await context.params;
    const { supabase, user } = await requireTwibbonAdmin();

    const { data: campaign, error: campErr } = await supabase
      .from('twibbon_campaigns')
      .select('id, draft_payload, edit_version')
      .eq('id', campaignId)
      .maybeSingle();

    if (campErr || !campaign) {
      throw new TwibbonHttpError(404, 'CAMPAIGN_NOT_FOUND', 'Kampanye tidak ditemukan.');
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const kind = String(formData.get('kind') || 'frame').trim();

    if (kind !== 'frame' && kind !== 'thumbnail') {
      throw new TwibbonHttpError(
        422,
        'VALIDATION_FAILED',
        'Jenis aset harus berupa "frame" atau "thumbnail".'
      );
    }

    if (!file || !(file instanceof File)) {
      throw new TwibbonHttpError(422, 'VALIDATION_FAILED', 'Berkas aset wajib disertakan.');
    }

    if (file.size <= 0) {
      throw new TwibbonHttpError(422, 'FRAME_INVALID', 'Berkas yang diunggah kosong.');
    }

    if (file.size > ADMIN_FRAME_MAX_BYTES) {
      throw new TwibbonHttpError(
        413,
        'PAYLOAD_TOO_LARGE',
        'Ukuran berkas maksimal 5 MiB (5.242.880 byte).'
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const assetId = crypto.randomUUID();

    if (kind === 'frame') {
      const verification = await validateAdminFramePngOnServer(bytes);

      if (!verification.valid) {
        throw new TwibbonHttpError(
          422,
          'FRAME_INVALID',
          verification.errorMessage || 'Bingkai harus PNG transparan 1080 × 1080.',
          {
            error_code: verification.errorCode,
            width: verification.width,
            height: verification.height,
            transparent_ratio: verification.transparentRatio,
            opaque_ratio: verification.opaqueRatio,
          }
        );
      }

      const storagePath = `twibbon/${campaignId}/${assetId}/frame.png`;

      const { error: uploadError } = await supabase.storage
        .from('twibbon-drafts')
        .upload(storagePath, bytes, {
          contentType: 'image/png',
          upsert: false,
        });

      if (uploadError) {
        throw new TwibbonHttpError(
          503,
          'ASSET_UNAVAILABLE',
          `Gagal menyimpan bingkai draft ke storage privat: ${uploadError.message}`
        );
      }

      const { data: assetRow, error: insertAssetErr } = await supabase
        .from('twibbon_assets')
        .insert({
          id: assetId,
          campaign_id: campaignId,
          kind: 'frame',
          visibility: 'private_draft',
          bucket_id: 'twibbon-drafts',
          storage_path: storagePath,
          public_url: null,
          mime_type: 'image/png',
          byte_size: verification.byteSize,
          width: 1080,
          height: 1080,
          checksum: verification.checksum || null,
          transparent_ratio: verification.transparentRatio ?? null,
          opaque_ratio: verification.opaqueRatio ?? null,
          has_transparency_warning: verification.hasTransparencyWarning,
          validation_status: 'valid',
          created_by: user.id,
        })
        .select('*')
        .single();

      if (insertAssetErr) {
        await supabase.storage.from('twibbon-drafts').remove([storagePath]);
        throw new TwibbonHttpError(500, 'INTERNAL_ERROR', insertAssetErr.message);
      }

      // Perbarui frame_asset_id pada draft_payload
      const nextPayload = {
        ...((campaign.draft_payload as Record<string, unknown>) || {}),
        frame_asset_id: assetId,
      };
      const nextVersion = campaign.edit_version + 1;

      await supabase
        .from('twibbon_campaigns')
        .update({
          draft_payload: nextPayload,
          edit_version: nextVersion,
          updated_by: user.id,
        })
        .eq('id', campaignId);

      await supabase.from('twibbon_audit_logs').insert({
        campaign_id: campaignId,
        actor_id: user.id,
        action: 'UPLOAD_FRAME',
        summary: 'Mengunggah dan memvalidasi bingkai PNG 1080x1080 ke storage draft privat.',
        changes: {
          asset_id: assetId,
          byte_size: verification.byteSize,
          checksum: verification.checksum,
          transparent_ratio: verification.transparentRatio,
          has_warning: verification.hasTransparencyWarning,
        },
      });

      const { data: signed } = await supabase.storage
        .from('twibbon-drafts')
        .createSignedUrl(storagePath, 600);

      return NextResponse.json(
        {
          asset: assetRow,
          signed_preview_url: signed?.signedUrl || null,
          edit_version: nextVersion,
          warning_message: verification.warningMessage || null,
        },
        { status: 201, headers: { 'Cache-Control': 'private, no-store' } }
      );
    }

    // kind === 'thumbnail'
    const header = parseImageHeader(bytes);
    if (
      (header.format !== 'png' && header.format !== 'jpeg' && header.format !== 'webp') ||
      header.isAnimated ||
      !header.width ||
      !header.height
    ) {
      throw new TwibbonHttpError(
        422,
        'VALIDATION_FAILED',
        'Thumbnail harus berupa gambar statis PNG, JPG, atau WebP yang valid.'
      );
    }

    const ext = header.format === 'jpeg' ? 'jpg' : header.format;
    const mimeType = `image/${header.format}`;
    const storagePath = `twibbon/${campaignId}/${assetId}/thumbnail.${ext}`;
    const checksum = crypto.createHash('sha256').update(bytes).digest('hex');

    const { error: uploadThumbErr } = await supabase.storage
      .from('twibbon-drafts')
      .upload(storagePath, bytes, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadThumbErr) {
      throw new TwibbonHttpError(
        503,
        'ASSET_UNAVAILABLE',
        `Gagal menyimpan thumbnail draft: ${uploadThumbErr.message}`
      );
    }

    const { data: thumbRow, error: insertThumbErr } = await supabase
      .from('twibbon_assets')
      .insert({
        id: assetId,
        campaign_id: campaignId,
        kind: 'thumbnail',
        visibility: 'private_draft',
        bucket_id: 'twibbon-drafts',
        storage_path: storagePath,
        public_url: null,
        mime_type: mimeType,
        byte_size: bytes.byteLength,
        width: header.width,
        height: header.height,
        checksum,
        validation_status: 'valid',
        created_by: user.id,
      })
      .select('*')
      .single();

    if (insertThumbErr) {
      await supabase.storage.from('twibbon-drafts').remove([storagePath]);
      throw new TwibbonHttpError(500, 'INTERNAL_ERROR', insertThumbErr.message);
    }

    const nextPayload = {
      ...((campaign.draft_payload as Record<string, unknown>) || {}),
      thumbnail_asset_id: assetId,
    };
    const nextVersion = campaign.edit_version + 1;

    await supabase
      .from('twibbon_campaigns')
      .update({
        draft_payload: nextPayload,
        edit_version: nextVersion,
        updated_by: user.id,
      })
      .eq('id', campaignId);

    const { data: signed } = await supabase.storage
      .from('twibbon-drafts')
      .createSignedUrl(storagePath, 600);

    return NextResponse.json(
      {
        asset: thumbRow,
        signed_preview_url: signed?.signedUrl || null,
        edit_version: nextVersion,
      },
      { status: 201, headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (err) {
    return createTwibbonErrorResponse(err);
  }
}

