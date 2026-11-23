'use client';

import React from 'react';
import Image from 'next/image';
import { Calendar, ExternalLink } from 'lucide-react';
import { Section, SectionHeading } from '@/components/ui/PublicPrimitives';

interface StrukturData {
  pembina: {
    nama: string;
    jabatan: string;
    ig: string;
    link: string;
    foto: string;
  };
  ketuaUmum: {
    id: string;
    nama: string;
    periode: string;
    jabatan: string;
    ig: string;
    link: string;
    foto: string;
  }[];
}

interface StrukturPimpinanProps {
  initialData?: StrukturData | null;
}

function convertGoogleDriveUrl(url: string): string {
  if (!url) return '';
  if (url.includes('uc?export=view') || !url.includes('drive.google.com')) {
    return url;
  }
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return url;
}

const defaultStruktur: StrukturData = {
  pembina: {
    nama: 'Sahru Romadloni, S.PD., M.PD',
    jabatan: 'Pembina UKM Pilar Bangsa',
    ig: '@sahru_romadloni',
    link: 'https://www.instagram.com/sahru_romadloni?igsh=ZXQ1NmRyb3V5ZWZr',
    foto: '/umum-ukm/pembina-ukm.webp',
  },
  ketuaUmum: [
    {
      id: '5',
      nama: 'Firdausi Nuzula',
      periode: '2026-2027',
      jabatan: 'Ketua Umum Kelima',
      ig: '@_zhull_03',
      link: 'https://www.instagram.com/_zhull_03?igsh=cjN1MTB0cnd6N2Zl',
      foto: '/umum-ukm/kak-nuzul.webp',
    },
    {
      id: '4',
      nama: 'Lidia Yesa Mega Wijayanti',
      periode: '2025-2026',
      jabatan: 'Ketua Umum Keempat',
      ig: '@lidia_megaa',
      link: 'https://www.instagram.com/lidia_megaa?igsh=b2Z2em1mcDM2cjJr',
      foto: '/umum-ukm/kak-lidia.webp',
    },
    {
      id: '3',
      nama: 'Aisyah Nabilla Pasha',
      periode: '2024-2025',
      jabatan: 'Ketua Umum Ketiga',
      ig: '@pashaa.a.n',
      link: 'https://www.instagram.com/pashaa.a.n?igsh=MXJrM2wwN2xndG5pOA==',
      foto: '/umum-ukm/kak-aisyah.webp',
    },
    {
      id: '2',
      nama: 'Putri Luvita Dewi',
      periode: '2023-2024',
      jabatan: 'Ketua Umum Kedua',
      ig: '@luvita_dewii',
      link: 'https://www.instagram.com/luvita_dewii?igsh=dGZqdXEyOHE3Y2Vm',
      foto: '/umum-ukm/kak-luvita.webp',
    },
    {
      id: '1',
      nama: 'Anisa Lutvia Marsya',
      periode: '2021-2023',
      jabatan: 'Ketua Umum Pertama',
      ig: '@anisaalutvia',
      link: 'https://www.instagram.com/anisaalutvia?igsh=MWxzbHZnYXJ2bXk1aQ==',
      foto: '/umum-ukm/kak-anisa.webp',
    },
  ],
};

export function StrukturPimpinan({ initialData }: StrukturPimpinanProps) {
  const data = initialData || defaultStruktur;
  const pembina = data.pembina;
  const ketuaUmum = data.ketuaUmum;

  return (
    <Section tone="muted" bordered ariaLabel="Tokoh dan pemimpin UKM Pilar Bangsa">
      <div className="space-y-12">
        <SectionHeading
          eyebrow="Kepengurusan & Estafet"
          title="Tokoh & Pemimpin"
          description="Mengenal lebih dekat pembina dan para ketua umum UKM Pilar Bangsa yang telah berdedikasi membangun organisasi."
        />

        {/* Pembina Section */}
        <div className="flex flex-col sm:flex-row items-start gap-6 pb-10 border-b border-gray-200">
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-lg overflow-hidden relative shrink-0 bg-gray-200">
            <Image
              src={convertGoogleDriveUrl(pembina.foto)}
              alt={pembina.nama}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 144px, 176px"
            />
          </div>

          <div className="space-y-3 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-[#E31837]">
              {pembina.jabatan}
            </p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {pembina.nama}
            </h3>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Senantiasa membimbing, mengarahkan, serta menginspirasi seluruh mahasiswa agar dapat menjalankan Tri Dharma Perguruan Tinggi dengan semangat kebangsaan yang tinggi.
            </p>
            <div className="pt-1">
              <a
                href={pembina.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-900 font-semibold text-sm transition-colors"
              >
                <span>Instagram {pembina.ig}</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        {/* Ketua Umum dari Masa ke Masa */}
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Ketua Umum dari Masa ke Masa
            </h3>
            <p className="text-gray-600 text-sm sm:text-base">
              Estafet kepemimpinan UKM Pilar Bangsa sejak berdiri tahun 2021.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {ketuaUmum.map((tokoh, idx) => (
              <div key={tokoh.id || idx} className="space-y-3">
                <div className="aspect-[4/5] w-full rounded-lg overflow-hidden relative bg-gray-200">
                  <Image
                    src={convertGoogleDriveUrl(tokoh.foto)}
                    alt={tokoh.nama}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#E31837]">
                    {tokoh.jabatan}
                  </p>
                  <h4 className="font-bold text-gray-900 text-sm sm:text-base leading-snug">
                    {tokoh.nama}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                    <span>{tokoh.periode}</span>
                  </div>
                  <div className="pt-1">
                    <a
                      href={tokoh.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-[#E31837] transition-colors"
                    >
                      <span>{tokoh.ig}</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
