import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import EditorTwibbonClient from './EditorTwibbonClient';
import type {
  TwibbonCampaignRow,
  TwibbonRevisionRow,
  TwibbonAuditLogRow,
  TwibbonAssetRow,
} from '@/types/twibbon';
import type { PublicEvent } from '@/types/events';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTwibbonPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [campaignRes, revisionsRes, auditRes, eventsRes] = await Promise.all([
    supabase.from('twibbon_campaigns').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('twibbon_revisions')
      .select('*')
      .eq('campaign_id', id)
      .order('revision_number', { ascending: false }),
    supabase
      .from('twibbon_audit_logs')
      .select('*')
      .eq('campaign_id', id)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase.from('public_events').select('*').order('created_at', { ascending: false }),
  ]);

  if (campaignRes.error || !campaignRes.data) {
    notFound();
  }

  const campaign = campaignRes.data as TwibbonCampaignRow;
  const revisions = (revisionsRes.data as TwibbonRevisionRow[]) || [];
  const auditLogs = (auditRes.data as TwibbonAuditLogRow[]) || [];
  const events = (eventsRes.data as PublicEvent[]) || [];

  // Resolve signed preview URL if draft has a frame asset
  let signedFrameUrl: string | null = null;
  const frameAssetId = campaign.draft_payload?.frame_asset_id;
  if (frameAssetId) {
    const { data: assetData } = await supabase
      .from('twibbon_assets')
      .select('*')
      .eq('id', frameAssetId)
      .maybeSingle();

    if (assetData) {
      const asset = assetData as TwibbonAssetRow;
      if (asset.bucket_id === 'twibbon-drafts') {
        const { data: signed } = await supabase.storage
          .from('twibbon-drafts')
          .createSignedUrl(asset.storage_path, 900);
        signedFrameUrl = signed?.signedUrl || null;
      } else {
        const { data: pub } = supabase.storage
          .from(asset.bucket_id)
          .getPublicUrl(asset.storage_path);
        signedFrameUrl = pub.publicUrl;
      }
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <EditorTwibbonClient
        initialCampaign={campaign}
        initialRevisions={revisions}
        initialAuditLogs={auditLogs}
        events={events}
        initialDraftFrameSignedUrl={signedFrameUrl}
      />
    </div>
  );
}

