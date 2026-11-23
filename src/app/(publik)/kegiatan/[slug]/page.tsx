import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { PublicEvent, PublicEventResource } from '@/types/events';
import {
  normalizeEventTimestamps,
  formatEventScheduleRangeWib,
} from '@/utils/eventDate';
import KegiatanResourceView from './KegiatanResourceView';
import { 
  Calendar, 
  MapPin, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  Archive, 
  Lock 
} from 'lucide-react';

export const revalidate = 60; // Otomatis revalidasi setiap 60 detik

interface PageProps {
  params: Promise<{ slug: string }>;
}

// 1. DYNAMIC METADATA (SEO & OpenGraph)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from('public_events')
    .select('title, summary, banner_url, publish_status')
    .eq('slug', slug)
    .in('publish_status', ['published', 'archived'])
    .maybeSingle();

  if (!event) {
    return {
      title: 'Kegiatan Tidak Ditemukan | UKM Pilar Bangsa',
      description: 'Halaman kegiatan tidak ditemukan atau belum dipublikasikan.',
    };
  }

  const title = `${event.title} | UKM Pilar Bangsa Untag Banyuwangi`;
  const description =
    event.summary ||
    `Pusat informasi resmi, berkas panduan, twibbon, dan pendaftaran ${event.title} UKM Pilar Bangsa.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.pilarbangsa.my.id/kegiatan/${slug}`,
      siteName: 'UKM Pilar Bangsa Untag Banyuwangi',
      locale: 'id_ID',
      type: 'article',
      images: event.banner_url
        ? [
            {
              url: event.banner_url,
              width: 1200,
              height: 630,
              alt: event.title,
            },
          ]
        : [
            {
              url: '/og-image.webp',
              width: 1200,
              height: 630,
              alt: event.title,
            },
          ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [event.banner_url || '/og-image.webp'],
    },
  };
}

// 2. PAGE COMPONENT
export default async function KegiatanDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch Event
  const { data: eventData, error: eventError } = await supabase
    .from('public_events')
    .select('*')
    .eq('slug', slug)
    .in('publish_status', ['published', 'archived'])
    .maybeSingle();

  if (eventError || !eventData) {
    // 404 tanpa bocoran informasi mengenai draft
    notFound();
  }

  const event: PublicEvent = normalizeEventTimestamps(eventData as PublicEvent);

  // Fetch Visible Resources
  const { data: resourcesData } = await supabase
    .from('public_event_resources')
    .select('*')
    .eq('event_id', event.id)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  const resources: PublicEventResource[] = (resourcesData as PublicEventResource[]) || [];

  const isArchived = event.publish_status === 'archived';
  const isRegOpen = event.registration_status === 'open';
  const isRegSoon = event.registration_status === 'soon';
  const isRegClosed = event.registration_status === 'closed';

  return (
    <div className="w-full">
      {/* Header Halaman Ringan */}
      <header className="w-full border-b border-gray-200 bg-gray-50 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 space-y-5">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500 font-medium"
          >
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Beranda
            </Link>
            <span aria-hidden="true" className="text-gray-300">
              /
            </span>
            <Link href="/kegiatan" className="hover:text-gray-900 transition-colors">
              Kegiatan
            </Link>
            <span aria-hidden="true" className="text-gray-300">
              /
            </span>
            <span className="text-gray-900 font-semibold line-clamp-1">{event.title}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            {isArchived ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-gray-200 text-gray-800 uppercase tracking-wider">
                <Archive size={12} aria-hidden="true" /> Arsip Kegiatan
              </span>
            ) : isRegOpen ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                <CheckCircle2 size={13} aria-hidden="true" /> Pendaftaran Dibuka
              </span>
            ) : isRegSoon ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
                <Clock size={13} aria-hidden="true" /> Segera Dibuka
              </span>
            ) : isRegClosed ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-red-100 text-[#E31837] uppercase tracking-wider">
                <Lock size={13} aria-hidden="true" /> Pendaftaran Ditutup
              </span>
            ) : null}

            <span className="text-xs font-bold text-[#E31837] uppercase tracking-wider">
              Resmi UKM Pilar Bangsa
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            {event.title}
          </h1>

          {event.summary && (
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-3xl">
              {event.summary}
            </p>
          )}

          {(event.starts_at || event.location) && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-gray-700 font-medium">
              {event.starts_at && (
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#E31837] shrink-0" aria-hidden="true" />
                  <span>{formatEventScheduleRangeWib(event.starts_at, event.ends_at)}</span>
                </div>
              )}

              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-[#008000] shrink-0" aria-hidden="true" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Isi Halaman */}
      <article className="w-full bg-white py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 space-y-10">
          {event.banner_url && (
            <div className="relative h-56 sm:h-72 md:h-96 w-full overflow-hidden rounded-lg bg-gray-900">
              <img
                src={event.banner_url}
                alt={event.title}
                width={1200}
                height={630}
                fetchPriority="high"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {event.description && (
            <div className="border-b border-gray-200 pb-8 space-y-2">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Tentang Kegiatan
              </h2>
              <div className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">
                {event.description}
              </div>
            </div>
          )}

          <section aria-label="Materi dan Tautan Kegiatan">
            <KegiatanResourceView
              resources={resources}
              eventTitle={event.title}
              eventSummary={event.summary}
              registrationStatus={event.registration_status}
              publishStatus={event.publish_status}
            />
          </section>

          <div className="pt-4 border-t border-gray-200">
            <Link
              href="/kegiatan"
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg text-sm font-bold text-gray-700 hover:text-[#E31837] hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Kembali ke Daftar Kegiatan</span>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
