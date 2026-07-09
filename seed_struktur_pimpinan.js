const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if(k && v) acc[k.trim()] = v.join('=').trim();
  return acc;
}, {});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY; // I need service role key to insert. Or Anon if RLS allows it?

if (!supabaseKey) {
  console.log("No service role key found. Skipping direct insertion. Please do it from UI or wait for me to do it with anon key.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const strukturPimpinan = {
  pembina: {
    nama: 'Sahru Romadloni, S.PD., M.PD',
    jabatan: 'Pembina UKM Pilar Bangsa',
    ig: '@sahru_romadloni',
    link: 'https://www.instagram.com/sahru_romadloni?igsh=ZXQ1NmRyb3V5ZWZr',
    foto: '/umum-ukm/pembina-ukm.webp'
  },
  ketuaUmum: [
    {
      id: '5',
      nama: 'Firdausi Nuzula',
      periode: '2026-2027',
      jabatan: 'Ketua Umum Kelima',
      ig: '@_zhull_03',
      link: 'https://www.instagram.com/_zhull_03?igsh=cjN1MTB0cnd6N2Zl',
      foto: '/umum-ukm/kak-nuzul.webp'
    },
    {
      id: '4',
      nama: 'Lidia Yesa Mega Wijayanti',
      periode: '2025-2026',
      jabatan: 'Ketua Umum Keempat',
      ig: '@lidia_megaa',
      link: 'https://www.instagram.com/lidia_megaa?igsh=b2Z2em1mcDM2cjJr',
      foto: '/umum-ukm/kak-lidia.webp'
    },
    {
      id: '3',
      nama: 'Aisyah Nabilla Pasha',
      periode: '2024-2025',
      jabatan: 'Ketua Umum Ketiga',
      ig: '@pashaa.a.n',
      link: 'https://www.instagram.com/pashaa.a.n?igsh=MXJrM2wwN2xndG5pOA==',
      foto: '/umum-ukm/kak-aisyah.webp'
    },
    {
      id: '2',
      nama: 'Putri Luvita Dewi',
      periode: '2023-2024',
      jabatan: 'Ketua Umum Kedua',
      ig: '@luvita_dewii',
      link: 'https://www.instagram.com/luvita_dewii?igsh=dGZqdXEyOHE3Y2Vm',
      foto: '/umum-ukm/kak-luvita.webp'
    },
    {
      id: '1',
      nama: 'Anisa Lutvia Marsya',
      periode: '2021-2023',
      jabatan: 'Ketua Umum Pertama',
      ig: '@anisaalutvia',
      link: 'https://www.instagram.com/anisaalutvia?igsh=MWxzbHZnYXJ2bXk1aQ==',
      foto: '/umum-ukm/kak-anisa.webp'
    }
  ]
};

async function seed() {
  const { data, error } = await supabase
    .from('website_settings')
    .upsert(
      { setting_key: 'struktur_pimpinan', setting_value: strukturPimpinan },
      { onConflict: 'setting_key' }
    );
    
  if (error) {
    console.error('Error upserting data:', error);
  } else {
    console.log('Successfully seeded struktur_pimpinan!');
  }
}

seed();
