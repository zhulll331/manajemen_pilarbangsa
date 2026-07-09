import { createClient } from '@/utils/supabase/server';
import StrukturPimpinanClient from './StrukturPimpinanClient';

export const dynamic = 'force-dynamic';

export default async function PengaturanWebsitePage() {
  const supabase = await createClient();
  
  const { data: settings } = await supabase
    .from('website_settings')
    .select('*')
    .eq('setting_key', 'struktur_pimpinan')
    .single();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Tokoh & Pemimpin</h1>
          <p className="text-gray-500 text-sm">Sesuaikan profil Pembina dan jajaran Ketua Umum yang akan tampil di halaman publik "Tentang Kami".</p>
        </div>
      </div>

      <StrukturPimpinanClient initialData={settings?.setting_value} />
    </div>
  );
}
