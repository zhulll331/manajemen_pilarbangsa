import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import EditorKegiatanClient from './EditorKegiatanClient';
import { PublicEvent, PublicEventResource } from '@/types/events';

export const dynamic = 'force-dynamic';

export default async function EditorKegiatanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === 'baru') {
    return <EditorKegiatanClient initialEvent={null} initialResources={[]} isNew={true} />;
  }

  const supabase = await createClient();

  const [eventResult, resourcesResult] = await Promise.all([
    supabase.from('public_events').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('public_event_resources')
      .select('*')
      .eq('event_id', id)
      .order('sort_order', { ascending: true }),
  ]);

  if (eventResult.error || !eventResult.data) {
    notFound();
  }

  const event: PublicEvent = eventResult.data as PublicEvent;
  const resources: PublicEventResource[] = (resourcesResult.data as PublicEventResource[]) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <EditorKegiatanClient
        initialEvent={event}
        initialResources={resources}
        isNew={false}
      />
    </div>
  );
}
