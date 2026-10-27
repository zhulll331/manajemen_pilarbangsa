import React from 'react';
import { createClient } from '@/utils/supabase/server';
import KelolaTwibbonClient from './KelolaTwibbonClient';
import type { TwibbonCampaignRow } from '@/types/twibbon';
import type { PublicEvent } from '@/types/events';

export const dynamic = 'force-dynamic';

export default async function KelolaTwibbonPage() {
  const supabase = await createClient();

  const [campaignsRes, eventsRes] = await Promise.all([
    supabase
      .from('twibbon_campaigns')
      .select('*')
      .order('updated_at', { ascending: false }),
    supabase
      .from('public_events')
      .select('*')
      .order('created_at', { ascending: false }),
  ]);

  const dbSchemaMissing =
    Boolean(campaignsRes.error) &&
    (campaignsRes.error?.code === '42P01' ||
      campaignsRes.error?.code === 'PGRST205' ||
      (campaignsRes.error?.message || '').includes('twibbon_campaigns'));

  const campaigns: TwibbonCampaignRow[] = (campaignsRes.data as TwibbonCampaignRow[]) || [];
  const events: PublicEvent[] = (eventsRes.data as PublicEvent[]) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <KelolaTwibbonClient
        initialCampaigns={campaigns}
        events={events}
        dbSchemaMissing={dbSchemaMissing}
      />
    </div>
  );
}

