import React, { Suspense } from 'react';
import Link from 'next/link';
import { HeroSlider } from '@/components/HeroSlider';
import { HeroSliderSkeleton } from '@/components/hero/HeroSliderSkeleton';
import { getHeroSlides } from '@/lib/heroSlides';
import { getMomentPhotos } from '@/lib/momentPhotos';
import { PilarPhotoMarquee } from '@/components/PilarPhotoMarquee';
import { TimelineRoadmap } from '@/components/TimelineRoadmap';
import { GeminiPromptBoxWrapper } from '@/components/GeminiPromptBoxWrapper';
import { PilarLoader } from '@/components/PilarLoader';
import { LinkButton, Section, SectionHeading } from '@/components/ui/PublicPrimitives';
import { SplitWordsHeading } from '@/components/motion/SplitWordsHeading';
import { GsapCardGroup } from '@/components/motion/GsapCardGroup';
import { createClient } from '@supabase/supabase-js';
import { ArrowRight, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { PublicEvent } from '@/types/events';
import { normalizeEventTimestamps, formatEventDateWib } from '@/utils/eventDate';

export const metadata = {
  title: 'Pilar Bangsa Digital Office | UKM Pilar Bangsa Untag Banyuwangi',
  description:
    'Wadah Transformasi & Kolaborasi Mahasiswa Universitas 17 Agustus 1945 (Untag) Banyuwangi. Mewujudkan tata kelola organisasi yang modern, transparan, dan akuntabel.',
  keywords: [
    'UKM Pilar Bangsa',
    'Untag Banyuwangi',
    'Pilar Bangsa Digital Office',
    'Universitas 17 Agustus 1945 Banyuwangi',
    'Organisasi Mahasiswa',
    'Sistem Manajemen Pilar Bangsa',
  ],
};

interface NewsItem {
  id: string;
  title: string;
  url: string;
  image_url: string;
  excerpt?: string;
  published_at?: string;
  created_at?: string;
  author?: string;
  category?: string;
}

async function getFeaturedEvent(): Promise<PublicEvent | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return null;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: activePeriod } = await supabase
      .from('periods')
      .select('id')
      .eq('status', 'active')
      .maybeSingle();

    let query = supabase
      .from('public_events')
      .select('*')
      .eq('is_featured', true)
      .eq('publish_status', 'published');

    if (activePeriod?.id) {
      query = query.eq('period_id', activePeriod.id);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) return null;
    return normalizeEventTimestamps(data as PublicEvent);
  } catch (err) {
    console.warn('Gagal fetch featured event untuk beranda:', err);
    return null;
  }
}

async function getNews(): Promise<NewsItem[]> {
  const mediaApiUrl =
    process.env.NEXT_PUBLIC_MEDIA_API_URL ||
    'https://www.mediapilarbangsa.web.id/api/berita-ukm?limit=6';

  const fetchMedia = async (): Promise<NewsItem[]> => {
    try {
      const res = await fetch(mediaApiUrl, {
        signal: AbortSignal.timeout(2000),
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const data: unknown = await res.json();
        if (Array.isArray(data)) {
          return data as NewsItem[];
        }
      }
    } catch (err) {
      console.warn('Gagal fetch berita dari portal media:', err);
    }
    return [];
  };

  const fetchHumas = async (): Promise<NewsItem[]> => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: activePeriod } = await supabase
          .from('periods')
          .select('id')
          .eq('status', 'active')
          .maybeSingle();

        let query = supabase
          .from('news_links')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6);

        if (activePeriod?.id) {
          query = query.eq('period_id', activePeriod.id);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return data.map((raw) => {
            const item = raw as NewsItem;
            return {
              ...item,
              category: item.category || 'Warta UKM',
            };
          });
        }
      }
    } catch (err) {
      console.error('Gagal fetch berita dari Supabase Humas:', err);
    }
    return [];
  };

  const [mediaNews, humasNews] = await Promise.all([fetchMedia(), fetchHumas()]);

  const combined = [...mediaNews, ...humasNews];
  const seenUrls = new Set<string>();
  const uniqueNews: NewsItem[] = [];

  for (const item of combined) {
    const key = (item.url || item.id || '').trim().toLowerCase();
    if (key && !seenUrls.has(key)) {
      seenUrls.add(key);
      uniqueNews.push(item);
    }
  }

  uniqueNews.sort((a, b) => {
    const dateA = new Date(a.published_at || a.created_at || 0).getTime();
    const dateB = new Date(b.published_at || b.created_at || 0).getTime();
    return dateB - dateA;
  });

  return uniqueNews.slice(0, 6);
}

async function HeroBannerSection() {
  const slides = await getHeroSlides();
  return <HeroSlider initialSlides={slides} />;
}

async function BeritaGrid() {
  const newsList = await getNews();

  if (newsList.length === 0) {
    return (
      <div className="py-10 border-t border-gray-200 text-gray-500 text-base">
        Belum ada berita terbaru saat ini.
      </div>
    );
  }

  return (
    <GsapCardGroup className="divide-y divide-gray-200 md:divide-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8">
      {newsList.map((news) => (
        <a
          key={news.id}
          href={news.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group pb-card-hover flex items-start gap-4 py-5 md:py-0 md:flex-col md:gap-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E31837] rounded-lg"
        >
          <div className="relative w-28 h-20 sm:w-32 sm:h-24 md:w-full md:h-48 shrink-0 overflow-hidden rounded-lg bg-gray-200">
            <img
              src={
                news.image_url ||
                'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=800&auto=format&fit=crop'
              }
              alt={news.title}
              width={640}
              height={360}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            />
          </div>

          <div className="flex flex-col flex-grow min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-semibold mb-1.5">
              {news.category && (
                <span className="text-[#E31837] uppercase tracking-wider">{news.category}</span>
              )}
              {news.category && news.published_at && <span aria-hidden="true">•</span>}
              {news.published_at && (
                <span>
                  {new Date(news.published_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>

            <h3 className="font-bold text-gray-900 text-base md:text-lg leading-snug group-hover:text-[#E31837] transition-colors line-clamp-3">
              {news.title}
            </h3>

            <div className="hidden md:flex mt-3 pt-2 items-center text-sm font-semibold text-gray-700 group-hover:text-[#E31837] transition-colors">
              <span>Baca selengkapnya</span>
              <ArrowRight
                className="w-4 h-4 ml-1.5 transform group-hover:translate-x-1 transition-transform"
                aria-hidden="true"
              />
            </div>
          </div>
        </a>
      ))}
    </GsapCardGroup>
  );
}

export default async function BerandaPage() {
  const [featuredEvent, momentResult] = await Promise.all([
    getFeaturedEvent(),
    getMomentPhotos(),
  ]);

  return (
    <div className="w-full">
      {/* 1. Hero Banner Penuh Lebar */}
      <Suspense fallback={<HeroSliderSkeleton />}>
        <HeroBannerSection />
      </Suspense>

      {/* 2. Sorotan Kegiatan Utama (Pita Hitam Penuh Lebar) */}
      {featuredEvent && (
        <Section tone="dark" ariaLabel="Sorotan kegiatan utama">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FFD700]">
                Sorotan Kegiatan Utama
              </p>

              <SplitWordsHeading
                as="h2"
                text={featuredEvent.title}
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white"
              />

              {featuredEvent.summary && (
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed line-clamp-3">
                  {featuredEvent.summary}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-300 pt-1 font-medium">
                {featuredEvent.starts_at && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={15} className="text-[#FFD700]" aria-hidden="true" />
                    <span>
                      {formatEventDateWib(featuredEvent.starts_at, {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {featuredEvent.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={15} className="text-[#E31837]" aria-hidden="true" />
                    <span>{featuredEvent.location}</span>
                  </div>
                )}
                {featuredEvent.registration_status === 'open' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 text-xs font-semibold border border-emerald-700/50">
                    <CheckCircle2 size={12} aria-hidden="true" /> Pendaftaran Dibuka
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <LinkButton
                href={`/kegiatan/${featuredEvent.slug}`}
                variant="primary"
                className="w-full sm:w-auto"
              >
                <span>
                  {featuredEvent.registration_status === 'open'
                    ? 'Lihat Info & Daftar'
                    : 'Lihat Informasi Kegiatan'}
                </span>
                <ArrowRight size={16} aria-hidden="true" />
              </LinkButton>

              <LinkButton
                href="/kegiatan"
                variant="dark-secondary"
                className="w-full sm:w-auto"
              >
                <span>Semua Kegiatan</span>
              </LinkButton>
            </div>
          </div>
        </Section>
      )}

      {/* 3. Marquee Dokumentasi Foto */}
      <PilarPhotoMarquee photos={momentResult.photos} />

      {/* 4. Timeline Roadmap Program Kerja */}
      <Section tone="white" ariaLabel="Timeline roadmap program kerja">
        <TimelineRoadmap />
      </Section>

      {/* 5. Berita Seputar UKM */}
      <Section tone="muted" bordered ariaLabel="Berita seputar UKM">
        <div className="space-y-8 md:space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Kabar Terkini"
              title="Berita Seputar UKM"
              description="Ikuti terus perkembangan, liputan, dan kegiatan terbaru dari UKM Pilar Bangsa."
            />
            <Link
              href="/kegiatan"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#E31837] hover:underline underline-offset-4 shrink-0"
            >
              <span>Agenda Resmi UKM</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          <Suspense
            fallback={
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <PilarLoader size="md" label="Memuat daftar berita" />
                <p className="text-sm text-gray-500 font-medium">Memuat berita terbaru...</p>
              </div>
            }
          >
            <BeritaGrid />
          </Suspense>
        </div>
      </Section>

      {/* 6. Call to Action Program Kerja (Pita Hitam Penuh Lebar) */}
      <Section tone="dark" ariaLabel="Transparansi program kerja">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FFD700]">
              Akuntabilitas Organisasi
            </p>
            <SplitWordsHeading
              as="h2"
              text="Transparansi Program Kerja & Dokumentasi"
              className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white"
            />
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
              Seluruh kegiatan, status pelaksanaan, dan dokumentasi program kerja UKM Pilar Bangsa dapat dipantau secara langsung oleh publik.
            </p>
          </div>

          <div className="shrink-0">
            <LinkButton
              href="/program-kerja"
              variant="dark-primary"
              className="w-full sm:w-auto"
            >
              <span>Lihat Daftar Program Kerja</span>
              <ArrowRight size={16} aria-hidden="true" />
            </LinkButton>
          </div>
        </div>
      </Section>

      {/* 7. AI Co-Pilot / Gemini Prompt Box */}
      <Section tone="white" containerSize="narrow" ariaLabel="Pilar Asisten AI">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="AI Co-Pilot UKM Pilar Bangsa"
            title="Tanyakan Apapun Seputar Proker & Organisasi"
            description="Didukung model AI dengan akses ke dokumen AD/ART dan data real-time organisasi untuk membantu menjawab pertanyaan Anda."
          />
          <GeminiPromptBoxWrapper />
        </div>
      </Section>
    </div>
  );
}
