import React from 'react';
import { createClient } from '@/utils/supabase/server';
import EditorTwibbonClient from '../[id]/EditorTwibbonClient';
import type { PublicEvent } from '@/types/events';

export const dynamic = 'force-dynamic';

export default async function BuatTwibbonBaruPage() {
  const supabase = await createClient();

  const { data: eventsData } = await supabase
    .from('public_events')
    .select('*')
    .order('created_at', { ascending: false });

  const events: PublicEvent[] = (eventsData as PublicEvent[]) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <EditorTwibbonClient
        initialCampaign={null}
        initialRevisions={[]}
        initialAuditLogs={[]}
        events={events}
        initialDraftFrameSignedUrl={null}
        isNew={true}
      />
    </div>
  );
}

