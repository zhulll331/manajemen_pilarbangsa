import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { PublicEvent, PublicEventResource } from '@/types/events';
import KegiatanResourceView from './KegiatanResourceView';
import { 
  Calendar, 
  MapPin, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  Archive, 
  Share2, 
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
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: event.banner_url ? [event.banner_url] : [],
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

  const event: PublicEvent = eventData as PublicEvent;

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 font-medium">
        <Link href="/" className="hover:text-gray-900 transition-colors">
          Beranda
        </Link>
        <span>/</span>
        <Link href="/kegiatan" className="hover:text-gray-900 transition-colors">
          Kegiatan
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold line-clamp-1">{event.title}</span>
      </nav>

      {/* Main Container */}
      <article className="space-y-8">
        {/* Banner Hero Card */}
        <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-xl">
          {event.banner_url && (
            <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden bg-gray-950">
              <img
                src={event.banner_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>
          )}

          <div className="p-6 sm:p-8 md:p-10 space-y-6">
            {/* Status & Category Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {isArchived ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 uppercase tracking-wider">
                  <Archive size={12} /> Arsip Kegiatan
                </span>
              ) : isRegOpen ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                  <CheckCircle2 size={13} /> Pendaftaran Dibuka
                </span>
              ) : isRegSoon ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                  <Clock size={13} /> Segera Dibuka
                </span>
              ) : isRegClosed ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 uppercase tracking-wider">
                  <Lock size={13} /> Pendaftaran Ditutup
                </span>
              ) : null}

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-[#E31837] border border-red-100 uppercase tracking-wider">
                Resmi UKM Pilar Bangsa
              </span>
            </div>

            {/* Title & Summary */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                {event.title}
              </h1>
              {event.summary && (
                <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                  {event.summary}
                </p>
              )}
            </div>

            {/* Date & Location Pill Bar */}
            {(event.starts_at || event.location) && (
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 border-t border-gray-100 text-sm text-gray-700 font-medium">
                {event.starts_at && (
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-red-50 text-[#E31837]">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Waktu Pelaksanaan</div>
                      <div className="font-bold text-gray-900">
                        {new Date(event.starts_at).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                        {event.ends_at && ` - ${new Date(event.ends_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}`}
                      </div>
                    </div>
                  </div>
                )}

                {event.location && (
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-green-50 text-[#008000]">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Tempat / Lokasi</div>
                      <div className="font-bold text-gray-900">{event.location}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Event Description (if any) */}
            {event.description && (
              <div className="pt-6 border-t border-gray-100 space-y-2">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Tentang Kegiatan
                </h2>
                <div className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resources & Items List */}
        <section aria-label="Materi dan Tautan Kegiatan">
          <KegiatanResourceView
            resources={resources}
            eventTitle={event.title}
            eventSummary={event.summary}
            registrationStatus={event.registration_status}
            publishStatus={event.publish_status}
          />
        </section>

        {/* Back Link */}
        <div className="pt-6 text-center">
          <Link
            href="/kegiatan"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#E31837] transition-colors p-3 rounded-2xl hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Daftar Kegiatan</span>
          </Link>
        </div>
      </article>
    </div>
  );
}
