import React from 'react';
import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { requireTwibbonAdmin } from '@/lib/twibbon/server-service';
import TwibbonWorkspaceClient from '@/components/twibbon/TwibbonWorkspaceClient';
import type {
  TwibbonCampaignRow,
  TwibbonAssetRow,
  TwibbonPublicCampaignDetail,
} from '@/types/twibbon';
import { ArrowLeft, Edit3 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pratinjau Privat Draft Twibbon | Admin Humas',
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminTwibbonPreviewPage({ params }: PageProps) {
  const { id } = await params;

  let supabase;
  try {
    const auth = await requireTwibbonAdmin();
    supabase = auth.supabase;
  } catch {
    redirect('/login');
  }

  const { data: campaignData, error } = await supabase
    .from('twibbon_campaigns')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !campaignData) {
    notFound();
  }

  const campaign = campaignData as TwibbonCampaignRow;
  const draft = campaign.draft_payload;

  let frameUrl = 'builtin:diklat-kepemimpinan-2026';
  let thumbnailUrl: string | null = null;

  if (draft.frame_asset_id) {
    const { data: frameAssetData } = await supabase
      .from('twibbon_assets')
      .select('*')
      .eq('id', draft.frame_asset_id)
      .maybeSingle();

    if (frameAssetData) {
      const frameAsset = frameAssetData as TwibbonAssetRow;
      if (frameAsset.bucket_id === 'twibbon-drafts') {
        const { data: signed } = await supabase.storage
          .from('twibbon-drafts')
          .createSignedUrl(frameAsset.storage_path, 900);
        if (signed?.signedUrl) {
          frameUrl = signed.signedUrl;
          thumbnailUrl = signed.signedUrl;
        }
      } else {
        const { data: pub } = supabase.storage
          .from(frameAsset.bucket_id)
          .getPublicUrl(frameAsset.storage_path);
        frameUrl = pub.publicUrl;
        thumbnailUrl = pub.publicUrl;
      }
    }
  }

  let relatedEvent: TwibbonPublicCampaignDetail['event'] = null;
  const eventId = campaign.event_id || draft.related_event_id;
  if (eventId) {
    const { data: ev } = await supabase
      .from('public_events')
      .select('id, title, slug, starts_at, ends_at, location, registration_status, publish_status')
      .eq('id', eventId)
      .maybeSingle();
    if (ev) {
      const startsAt = ev.starts_at ? String(ev.starts_at) : null;
      relatedEvent = {
        id: String(ev.id),
        title: String(ev.title),
        slug: String(ev.slug),
        date: startsAt ? startsAt.slice(0, 10) : null,
        starts_at: startsAt,
        ends_at: ev.ends_at ? String(ev.ends_at) : null,
        location: ev.location ? String(ev.location) : null,
        timezone: 'Asia/Jakarta',
        url: `/kegiatan/${String(ev.slug)}`,
        registration_status: ev.registration_status ? String(ev.registration_status) : null,
      };
    }
  }

  const previewCampaign: TwibbonPublicCampaignDetail = {
    id: campaign.id,
    slug: campaign.slug,
    state: campaign.state === 'archived' ? 'archived' : 'published',
    can_generate: true,
    revision_id: 'draft-preview',
    revision_number: 0,
    title: draft.title || '(Draft Tanpa Judul)',
    description: draft.description || null,
    frame: {
      url: frameUrl,
      width: 1080,
      height: 1080,
    },
    thumbnail_url: thumbnailUrl,
    caption_default: draft.caption_default || '',
    caption_template: draft.caption_template || '',
    published_at: campaign.updated_at,
    archived_at: campaign.archived_at,
    event: relatedEvent,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <Link
          href={`/dashboard/humas/twibbon/${campaign.id}`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700 hover:text-[#E31837]"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Editor Kampanye</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500">
            edit_version: v{campaign.edit_version}
          </span>
          <Link
            href={`/dashboard/humas/twibbon/${campaign.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E31837] hover:bg-red-700 text-white text-xs font-bold"
          >
            <Edit3 size={14} />
            <span>Edit Draft</span>
          </Link>
        </div>
      </div>

      <TwibbonWorkspaceClient campaign={previewCampaign} isPreviewMode={true} />
    </div>
  );
}

