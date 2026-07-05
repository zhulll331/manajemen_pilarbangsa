import { createClient } from '@/utils/supabase/server';
import BeritaClient from './BeritaClient';

export const dynamic = 'force-dynamic';

export default async function KelolaBeritaPage() {
  const supabase = await createClient();
  
  const { data: news } = await supabase
    .from('news_links')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Berita Publik</h1>
          <p className="text-gray-500 text-sm">Tambahkan tautan berita yang akan muncul di Beranda utama.</p>
        </div>
      </div>

      <BeritaClient initialData={news || []} />
    </div>
  );
}
