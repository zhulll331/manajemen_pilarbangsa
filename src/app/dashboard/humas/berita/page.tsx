import { getSelectedPeriodForDashboard } from '@/lib/periods/server';
import { isSchemaMissingError } from '@/lib/periods/utils';
import { createClient } from '@/utils/supabase/server';
import BeritaClient from './BeritaClient';

export const dynamic = 'force-dynamic';

export default async function KelolaBeritaPage() {
  const supabase = await createClient();
  const { selectedPeriod, isLocked, schemaReady } =
    await getSelectedPeriodForDashboard();

  let query = supabase
    .from('news_links')
    .select('*')
    .order('created_at', { ascending: false });

  if (schemaReady) {
    query = query.eq('period_id', selectedPeriod.id);
  }

  const { data: initialNews, error } = await query;
  let news = initialNews;
  if (schemaReady && isSchemaMissingError(error)) {
    const fallback = await supabase
      .from('news_links')
      .select('*')
      .order('created_at', { ascending: false });
    news = fallback.data;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Berita Publik</h1>
          <p className="text-gray-500 text-sm">
            Tambahkan tautan berita yang akan muncul di Beranda utama (Periode {selectedPeriod.code}).
          </p>
        </div>
      </div>

      <BeritaClient
        initialData={news || []}
        periodId={schemaReady ? selectedPeriod.id : null}
        isLocked={isLocked}
      />
    </div>
  );
}
