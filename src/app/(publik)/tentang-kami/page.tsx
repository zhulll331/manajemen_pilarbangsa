import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { StrukturPimpinan } from '@/components/StrukturPimpinan';
import { FilosofiLogoAnimated } from '@/components/FilosofiLogoAnimated';
import { PageHeader, Section, SectionHeading } from '@/components/ui/PublicPrimitives';
import { SplitWordsHeading } from '@/components/motion/SplitWordsHeading';
import { GsapCardGroup } from '@/components/motion/GsapCardGroup';

async function getStrukturPimpinan() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data } = await supabase
    .from('website_settings')
    .select('setting_value')
    .eq('setting_key', 'struktur_pimpinan')
    .single();

  if (data?.setting_value) {
    return data.setting_value;
  }
  return null;
}

export const revalidate = 60;

export default async function TentangPage() {
  const strukturData = await getStrukturPimpinan();

  return (
    <div className="w-full">
      {/* 1. Header Halaman Ringan */}
      <PageHeader
        breadcrumbs={[
          { label: 'Beranda', href: '/' },
          { label: 'Tentang Kami' },
        ]}
        eyebrow="Profil & Arah Juang Organisasi"
        title="Mengenal Lebih Dekat UKM Pilar Bangsa"
        description="Wadah pembinaan kepemimpinan dan manajerial mahasiswa berlandaskan semangat kebangsaan, riset, dan pengabdian masyarakat."
      />

      {/* 2. Sejarah Berdirinya & Transformasi Digital */}
      <Section tone="white" ariaLabel="Sejarah dan komitmen organisasi">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-7 space-y-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E31837]">
              Titik Mula Sejarah &amp; Transformasi Digital
            </p>
            <SplitWordsHeading
              as="h2"
              text="Berdiri Sejak 20 April 2021, Bertransformasi Digital pada 2026/2027"
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight"
            />
            <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
              UKM Pilar Bangsa lahir dari refleksi para aktivis mahasiswa pada{' '}
              <span className="font-bold text-[#E31837]">20 April 2021</span>. Berangkat dari semangat juang untuk menghadirkan wadah organisasi kemahasiswaan yang progresif, independen, dan berakar pada nilai-nilai luhur kebangsaan.
            </p>
            <blockquote className="text-gray-700 text-base leading-relaxed border-l-4 border-[#E31837] pl-5 py-1">
              <strong className="text-gray-900 block mb-1.5">
                Transformasi Pilar Digital Office (Periode 2026/2027)
              </strong>
              Sebagai wujud komitmen mewujudkan tata kelola organisasi yang berdaya saing global, UKM Pilar Bangsa meluncurkan platform terpadu{' '}
              <strong className="text-gray-900">Pilar Digital Office</strong> sebagai perwujudan{' '}
              <strong className="text-gray-900">Misi ke-2 Kepengurusan</strong>: tata kelola modern, efektif, efisien, dan transparan bagi publik.
            </blockquote>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xl font-extrabold text-gray-900 tracking-tight pb-3 border-b border-gray-200">
              Tonggak Komitmen Organisasi
            </h3>
            <ul className="divide-y divide-gray-200 text-gray-700 text-sm sm:text-base">
              <li className="py-4 first:pt-2 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#008000] shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <strong className="text-gray-900">Digitalisasi Tatakelola:</strong> Beralih dari sistem konvensional menuju platform terpadu Pilar Digital Office (Misi ke-2 Kepengurusan 2026/2027).
                </span>
              </li>
              <li className="py-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#008000] shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <strong className="text-gray-900">Transparansi Nyata:</strong> Masyarakat dan civitas akademika dapat memantau langsung status serta kelengkapan arsip setiap program kerja.
                </span>
              </li>
              <li className="py-4 last:pb-0 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#008000] shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <strong className="text-gray-900">Pengkaderan Berkualitas:</strong> Mencetak calon pemimpin masa depan yang kompeten, adaptif teknologi, dan berkarakter kebangsaan.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Section>

      {/* 3. Tokoh & Pemimpin */}
      <StrukturPimpinan initialData={strukturData} />

      {/* 4. Filosofi Logo (3 Kolom Dipisah Garis Tipis) */}
      <Section tone="white" ariaLabel="Filosofi logo UKM Pilar Bangsa">
        <div className="space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
            <FilosofiLogoAnimated />
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#E31837]">
                Filosofi Logo
              </p>
              <SplitWordsHeading
                as="h2"
                text="UKM Pilar Bangsa"
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight"
              />
              <p className="text-gray-600 text-base leading-relaxed">
                Logo UKM Pilar Bangsa menggambarkan fondasi kebangsaan yang kokoh, semangat Tri Dharma Perguruan Tinggi, serta cita-cita luhur Trisakti Bung Karno.
              </p>
            </div>
          </div>

          <GsapCardGroup className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-0 lg:divide-x lg:divide-gray-200 border-y border-gray-200 py-10">
            {/* 01: 4 Pondasi */}
            <div className="lg:pr-8 space-y-6">
              <div className="space-y-1">
                <span className="text-2xl font-black text-[#E31837]">01</span>
                <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  4 PONDASI
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Fondasi Kebangsaan
                </p>
              </div>

              <dl className="space-y-4">
                <div>
                  <dt className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                    Pancasila
                  </dt>
                  <dd className="text-gray-600 text-sm leading-relaxed mt-0.5">
                    Dasar negara dan ideologi bangsa Indonesia.
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                    UUD 1945
                  </dt>
                  <dd className="text-gray-600 text-sm leading-relaxed mt-0.5">
                    Konstitusi negara sebagai pedoman kehidupan berbangsa.
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                    NKRI
                  </dt>
                  <dd className="text-gray-600 text-sm leading-relaxed mt-0.5">
                    Bentuk negara kesatuan yang menyatukan seluruh rakyat.
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                    Bhinneka Tunggal Ika
                  </dt>
                  <dd className="text-gray-600 text-sm leading-relaxed mt-0.5">
                    Semboyan yang menegaskan persatuan dalam keberagaman.
                  </dd>
                </div>
              </dl>
            </div>

            {/* 02: 3 Pilar */}
            <div className="lg:px-8 space-y-6 border-t border-gray-200 pt-8 lg:border-t-0 lg:pt-0">
              <div className="space-y-1">
                <span className="text-2xl font-black text-amber-600">02</span>
                <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  3 PILAR
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Tri Dharma Perguruan Tinggi
                </p>
              </div>

              <dl className="space-y-4">
                <div>
                  <dt className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                    Pembelajaran
                  </dt>
                  <dd className="text-gray-600 text-sm leading-relaxed mt-0.5">
                    Proses pendidikan untuk mengembangkan ilmu dan karakter.
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                    Penelitian
                  </dt>
                  <dd className="text-gray-600 text-sm leading-relaxed mt-0.5">
                    Kegiatan ilmiah untuk mencari kebenaran dan inovasi.
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                    Pengabdian
                  </dt>
                  <dd className="text-gray-600 text-sm leading-relaxed mt-0.5">
                    Aksi nyata untuk memberi manfaat bagi masyarakat.
                  </dd>
                </div>
              </dl>
            </div>

            {/* 03: Atap Segitiga */}
            <div className="lg:pl-8 space-y-6 border-t border-gray-200 pt-8 lg:border-t-0 lg:pt-0">
              <div className="space-y-1">
                <span className="text-2xl font-black text-[#008000]">03</span>
                <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  ATAP SEGITIGA
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Trisakti Sukarno
                </p>
              </div>

              <dl className="space-y-4">
                <div>
                  <dt className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                    Berdaulat
                  </dt>
                  <dd className="text-gray-600 text-sm leading-relaxed mt-0.5">
                    Berdaulat di bidang politik untuk mewujudkan kedaulatan rakyat dan negara.
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                    Berdikari
                  </dt>
                  <dd className="text-gray-600 text-sm leading-relaxed mt-0.5">
                    Berdikari di bidang ekonomi untuk kemandirian bangsa dan kesejahteraan rakyat.
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                    Berkepribadian
                  </dt>
                  <dd className="text-gray-600 text-sm leading-relaxed mt-0.5">
                    Berkepribadian di bidang budaya untuk membangun jati diri bangsa yang luhur.
                  </dd>
                </div>
              </dl>
            </div>
          </GsapCardGroup>

          <div className="max-w-3xl space-y-2">
            <h3 className="text-lg font-extrabold text-gray-900 uppercase tracking-wide">
              Makna Dalam Satu Kesatuan
            </h3>
            <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
              Empat pondasi kebangsaan menjadi dasar yang kokoh, tiga pilar Tri Dharma menjadi gerakan, dan Trisakti Sukarno menjadi cita luhur yang menaungi setiap langkah Pilar Bangsa.
            </p>
          </div>
        </div>
      </Section>

      {/* 5. Nilai-Nilai Penggerak: Tri Dharma & Trisakti */}
      <Section tone="muted" bordered ariaLabel="Tri Dharma dan Trisakti Sukarno">
        <div className="space-y-10">
          <SectionHeading
            eyebrow="Nilai-Nilai Penggerak"
            title="Tri Dharma & Trisakti Sukarno"
            description="Sinergi antara tanggung jawab insan akademis dengan visi besar bapak bangsa untuk mencapai kejayaan Indonesia."
          />

          <GsapCardGroup className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12">
            {/* Tri Dharma Perguruan Tinggi */}
            <div className="border-t-2 border-[#008000] pt-6 space-y-5">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Tri Dharma Perguruan Tinggi
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">3 Pilar Pengabdian Mahasiswa</p>
              </div>

              <ol className="space-y-4">
                <li className="space-y-1">
                  <h4 className="font-bold text-gray-900 text-base">
                    1. Pembelajaran (Pendidikan)
                  </h4>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    Mengembangkan keilmuan dan kompetensi mahasiswa melalui kajian, seminar, dan diskusi aktif.
                  </p>
                </li>
                <li className="space-y-1">
                  <h4 className="font-bold text-gray-900 text-base">
                    2. Penelitian (Riset &amp; Inovasi)
                  </h4>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    Mencari solusi praktis dan inovatif terhadap berbagai permasalahan sosial dan teknologi.
                  </p>
                </li>
                <li className="space-y-1">
                  <h4 className="font-bold text-gray-900 text-base">
                    3. Pengabdian kepada Masyarakat
                  </h4>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    Mendedikasikan waktu, tenaga, dan pemikiran guna membantu mensejahterakan masyarakat sekitar.
                  </p>
                </li>
              </ol>
            </div>

            {/* Trisakti Sukarno */}
            <div className="border-t-2 border-[#E31837] pt-6 space-y-5">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Trisakti Sukarno
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">Atap Pijakan Arah Juang Bangsa</p>
              </div>

              <ol className="space-y-4">
                <li className="space-y-1">
                  <h4 className="font-bold text-gray-900 text-base">
                    1. Berdaulat dalam Politik
                  </h4>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    Membangun kesadaran hukum, politik, dan kebangsaan agar mahasiswa menjadi agen kontrol sosial yang independen.
                  </p>
                </li>
                <li className="space-y-1">
                  <h4 className="font-bold text-gray-900 text-base">
                    2. Berdikari dalam Ekonomi
                  </h4>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    Mengembangkan jiwa kewirausahaan (entrepreneurship) dan kemandirian finansial organisasi.
                  </p>
                </li>
                <li className="space-y-1">
                  <h4 className="font-bold text-gray-900 text-base">
                    3. Berkepribadian dalam Kebudayaan
                  </h4>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                    Melestarikan kearifan lokal dan bangga mencerminkan karakter budaya bangsa di dunia internasional.
                  </p>
                </li>
              </ol>
            </div>
          </GsapCardGroup>
        </div>
      </Section>
    </div>
  );
}
