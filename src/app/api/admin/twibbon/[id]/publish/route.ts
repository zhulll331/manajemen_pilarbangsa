import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import {
  TwibbonHttpError,
  createTwibbonErrorResponse,
  requireTwibbonAdmin,
} from '@/lib/twibbon/server-service';
import { validateAdminCampaignFields } from '@/lib/twibbon/validation';
import { validateAdminFramePngOnServer } from '@/lib/twibbon/server-png-validator';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const newlyCopiedPublicPaths: string[] = [];
  let supabaseRef: Awaited<ReturnType<typeof requireTwibbonAdmin>>['supabase'] | null = null;

  try {
    const { id: campaignId } = await context.params;
    const { supabase } = await requireTwibbonAdmin();
    supabaseRef = supabase;

    const body = await request.json().catch(() => ({}));
    const expectedVersion = Number(body.expected_version);

    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
      throw new TwibbonHttpError(
        422,
        'VALIDATION_FAILED',
        'Parameter expected_version wajib disertakan untuk publikasi.'
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
        'Ada perubahan dari admin lain. Muat versi terbaru sebelum mempublikasikan.'
      );
    }

    const payload = (campaign.draft_payload || {}) as Record<string, unknown>;
    const title = String(body.title ?? payload.title ?? '').trim();
    const description = String(body.description ?? payload.description ?? '').trim();
    const captionDefault = String(
      body.caption_default ?? payload.caption_default ?? ''
    ).trim();
    const captionTemplate =
      String(body.caption_template ?? payload.caption_template ?? '').trim() ||
      captionDefault;
    const frameAssetId = String(
      body.frame_asset_id ?? payload.frame_asset_id ?? ''
    ).trim();
    const thumbnailAssetId = body.thumbnail_asset_id
      ? String(body.thumbnail_asset_id).trim()
      : payload.thumbnail_asset_id
      ? String(payload.thumbnail_asset_id).trim()
      : null;

    const fieldCheck = validateAdminCampaignFields({
      title,
      slug: campaign.slug,
      description,
      captionDefault,
      captionTemplate,
      requireReadyForPublish: true,
      hasValidFrame: Boolean(frameAssetId),
    });

    if (!fieldCheck.valid) {
      throw new TwibbonHttpError(422, 'VALIDATION_FAILED', fieldCheck.errors[0], {
        errors: fieldCheck.errors,
      });
    }

    // 1. Ambil metadata aset frame dan pastikan valid
    const { data: frameAsset, error: frameAssetErr } = await supabase
      .from('twibbon_assets')
      .select('*')
      .eq('id', frameAssetId)
      .eq('campaign_id', campaignId)
      .eq('kind', 'frame')
      .maybeSingle();

    if (
      frameAssetErr ||
      !frameAsset ||
      frameAsset.validation_status !== 'valid' ||
      frameAsset.width !== 1080 ||
      frameAsset.height !== 1080
    ) {
      throw new TwibbonHttpError(
        422,
        'FRAME_INVALID',
        'Bingkai harus PNG transparan 1080 × 1080 yang valid sebelum dipublikasikan.'
      );
    }

    // 2. Pastikan salinan publik berversi di bucket 'twibbon-frames' tersedia & terverifikasi
    let framePublicUrl = frameAsset.public_url;
    if (!framePublicUrl) {
      const { data: draftFileBlob, error: downloadErr } = await supabase.storage
        .from(frameAsset.bucket_id)
        .download(frameAsset.storage_path);

      if (downloadErr || !draftFileBlob) {
        throw new TwibbonHttpError(
          503,
          'ASSET_UNAVAILABLE',
          'Berkas bingkai draft tidak dapat ditemukan di storage. Silakan unggah ulang bingkai.'
        );
      }

      const frameBytes = new Uint8Array(await draftFileBlob.arrayBuffer());
      const reverify = await validateAdminFramePngOnServer(frameBytes);
      if (!reverify.valid) {
        throw new TwibbonHttpError(
          422,
          'FRAME_INVALID',
          reverify.errorMessage || 'Bingkai gagal verifikasi ulang saat publikasi.'
        );
      }

      const publicStoragePath = `twibbon/${campaignId}/${frameAsset.id}/frame.png`;
      const { error: copyErr } = await supabase.storage
        .from('twibbon-frames')
        .upload(publicStoragePath, frameBytes, {
          contentType: 'image/png',
          cacheControl: '31536000',
          upsert: false,
        });

      if (copyErr && !copyErr.message?.toLowerCase().includes('already exists')) {
        throw new TwibbonHttpError(
          503,
          'ASSET_UNAVAILABLE',
          `Gagal menyalin bingkai ke storage publik: ${copyErr.message}`
        );
      }

      if (!copyErr) {
        newlyCopiedPublicPaths.push(publicStoragePath);
      }

      const { data: pubUrlData } = supabase.storage
        .from('twibbon-frames')
        .getPublicUrl(publicStoragePath);

      if (!pubUrlData?.publicUrl) {
        throw new TwibbonHttpError(
          503,
          'ASSET_UNAVAILABLE',
          'Gagal membentuk URL publik untuk bingkai.'
        );
      }
      framePublicUrl = pubUrlData.publicUrl;
    }

    // 3. Jika ada thumbnail kustom, salin ke bucket publik berversi
    let thumbnailPublicUrl: string | null = null;
    if (thumbnailAssetId) {
      const { data: thumbAsset } = await supabase
        .from('twibbon_assets')
        .select('*')
        .eq('id', thumbnailAssetId)
        .eq('campaign_id', campaignId)
        .eq('kind', 'thumbnail')
        .maybeSingle();

      if (thumbAsset) {
        if (thumbAsset.public_url) {
          thumbnailPublicUrl = thumbAsset.public_url;
        } else {
          const { data: thumbBlob } = await supabase.storage
            .from(thumbAsset.bucket_id)
            .download(thumbAsset.storage_path);
          if (thumbBlob) {
            const ext = thumbAsset.storage_path.split('.').pop() || 'png';
            const pubThumbPath = `twibbon/${campaignId}/${thumbAsset.id}/thumbnail.${ext}`;
            const thumbBytes = new Uint8Array(await thumbBlob.arrayBuffer());
            const { error: thumbUpErr } = await supabase.storage
              .from('twibbon-frames')
              .upload(pubThumbPath, thumbBytes, {
                contentType: thumbAsset.mime_type,
                cacheControl: '31536000',
                upsert: false,
              });
            if (!thumbUpErr) {
              newlyCopiedPublicPaths.push(pubThumbPath);
            }
            const { data: thumbUrlData } = supabase.storage
              .from('twibbon-frames')
              .getPublicUrl(pubThumbPath);
            thumbnailPublicUrl = thumbUrlData?.publicUrl || null;
          }
        }
      }
    }

    // 4. Ambil snapshot kegiatan terkait jika ada
    let eventSnapshot: Record<string, unknown> | null = null;
    if (campaign.event_id) {
      const { data: ev } = await supabase
        .from('public_events')
        .select('id, title, slug, starts_at, ends_at, location')
        .eq('id', campaign.event_id)
        .maybeSingle();
      if (ev) {
        eventSnapshot = ev;
      }
    }

    // 5. Jalankan transaksi publikasi atomik via RPC
    const { data: publishResult, error: rpcErr } = await supabase.rpc(
      'rpc_publish_twibbon_campaign',
      {
        p_campaign_id: campaignId,
        p_expected_version: expectedVersion,
        p_title: title,
        p_description: description,
        p_frame_asset_id: frameAssetId,
        p_frame_public_url: framePublicUrl,
        p_thumbnail_asset_id: thumbnailAssetId,
        p_thumbnail_public_url: thumbnailPublicUrl,
        p_caption_default: captionDefault,
        p_caption_template: captionTemplate,
        p_event_snapshot: eventSnapshot,
      }
    );

    if (rpcErr) {
      // Jika transaksi metadata gagal, bersihkan file publik yatim tanpa menyentuh pointer revisi lama (PRD 14.3, T26)
      if (newlyCopiedPublicPaths.length > 0) {
        await supabase.storage.from('twibbon-frames').remove(newlyCopiedPublicPaths);
      }
      throw new Error(rpcErr.message);
    }

    revalidatePath('/twibbon');
    revalidatePath(`/twibbon/${campaign.slug}`);
    revalidatePath('/kegiatan');

    return NextResponse.json(
      {
        published: true,
        result: publishResult,
        frame_public_url: framePublicUrl,
        thumbnail_public_url: thumbnailPublicUrl,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    if (supabaseRef && newlyCopiedPublicPaths.length > 0) {
      try {
        await supabaseRef.storage.from('twibbon-frames').remove(newlyCopiedPublicPaths);
      } catch {
        // ignore cleanup error
      }
    }
    return createTwibbonErrorResponse(err);
  }
}

