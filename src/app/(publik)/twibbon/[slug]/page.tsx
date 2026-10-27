import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchPublicTwibbonCampaignBySlug } from '@/lib/twibbon/server-service';
import TwibbonWorkspaceClient from '@/components/twibbon/TwibbonWorkspaceClient';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await fetchPublicTwibbonCampaignBySlug(slug);

  if (!campaign) {
    return {
      title: 'Twibbon Belum Tersedia | UKM Pilar Bangsa',
      description: 'Twibbon ini belum tersedia. Kembali ke daftar twibbon resmi UKM Pilar Bangsa.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${campaign.title} | Twibbon Pilar Bangsa`;
  const description =
    campaign.description ||
    `Pasang bingkai Twibbon resmi 1080×1080 dan salin caption ${campaign.title} UKM Pilar Bangsa langsung dari perangkat Anda.`;

  const dynamicOgImageUrl = `https://www.pilarbangsa.my.id/twibbon/${campaign.slug}/opengraph-image`;
  const campaignPhotoUrl =
    (campaign.thumbnail_url && !campaign.thumbnail_url.startsWith('builtin:')
      ? campaign.thumbnail_url
      : null) ||
    (campaign.frame.url && !campaign.frame.url.startsWith('builtin:')
      ? campaign.frame.url
      : null);

  const canonicalUrl = `https://www.pilarbangsa.my.id/twibbon/${campaign.slug}`;

  const ogImages = [
    {
      url: dynamicOgImageUrl,
      width: 1200,
      height: 630,
      alt: `${campaign.title} - Twibbon UKM Pilar Bangsa`,
      type: 'image/png',
    },
    ...(campaignPhotoUrl
      ? [
          {
            url: campaignPhotoUrl,
            width: 1080,
            height: 1080,
            alt: campaign.title,
            type: 'image/png',
          },
        ]
      : []),
  ];

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'UKM Pilar Bangsa Untag Banyuwangi',
      locale: 'id_ID',
      type: 'website',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [dynamicOgImageUrl],
    },
  };
}

export default async function TwibbonDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const campaign = await fetchPublicTwibbonCampaignBySlug(slug);

  if (!campaign) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500 font-medium"
      >
        <Link href="/" className="hover:text-gray-900 transition-colors">
          Beranda
        </Link>
        <span>/</span>
        <Link href="/twibbon" className="hover:text-gray-900 transition-colors">
          Twibbon
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold line-clamp-1">{campaign.title}</span>
      </nav>

      {/* Main Interactive Workspace */}
      <TwibbonWorkspaceClient campaign={campaign} />

      {/* Back Link */}
      <div className="pt-4 text-center">
        <Link
          href="/twibbon"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#E31837] transition-colors p-3 rounded-2xl hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Daftar Twibbon</span>
        </Link>
      </div>
    </div>
  );
}

