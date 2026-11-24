import { getSelectedPeriodForDashboard } from '@/lib/periods/server';
import { isSchemaMissingError } from '@/lib/periods/utils';
import { createClient } from '@/utils/supabase/server';
import KelolaKegiatanClient from './KelolaKegiatanClient';
import { PublicEvent } from '@/types/events';

export const dynamic = 'force-dynamic';

export default async function KelolaKegiatanPage() {
  const supabase = await createClient();
  const { selectedPeriod, schemaReady } = await getSelectedPeriodForDashboard();

  let query = supabase
    .from('public_events')
    .select('*')
    .order('created_at', { ascending: false });

  if (schemaReady) {
    query = query.eq('period_id', selectedPeriod.id);
  }

  let { data, error } = await query;
  if (schemaReady && isSchemaMissingError(error)) {
    const fallback = await supabase
      .from('public_events')
      .select('*')
      .order('created_at', { ascending: false });
    data = fallback.data;
    error = fallback.error;
  }

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
