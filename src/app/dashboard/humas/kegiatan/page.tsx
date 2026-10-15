import { createClient } from '@/utils/supabase/server';
import KelolaKegiatanClient from './KelolaKegiatanClient';
import { PublicEvent } from '@/types/events';

export const dynamic = 'force-dynamic';

export default async function KelolaKegiatanPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('public_events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching public_events in dashboard:', error);
  }

  const events: PublicEvent[] = (data as PublicEvent[]) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <KelolaKegiatanClient initialEvents={events} />
    </div>
  );
}
