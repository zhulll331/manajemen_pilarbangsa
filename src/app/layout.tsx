import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SplashScreenWrapper } from '@/components/SplashScreenWrapper'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.pilarbangsa.my.id'),
  title: {
    template: "%s | UKM Pilar Bangsa Untag Banyuwangi",
    default: "Unit Kegiatan Mahasiswa: Pilar Bangsa Untag Banyuwangi",
  },
  description: "Wadah Transformasi & Kolaborasi Mahasiswa Universitas 17 Agustus 1945 (Untag) Banyuwangi. Pilar Bangsa Digital Office mewujudkan tata kelola organisasi yang modern, transparan, dan akuntabel.",
  keywords: [
    "UKM Pilar Bangsa Untag Banyuwangi", 
    "Universitas 17 Agustus 1945 Banyuwangi", 
    "Untag Banyuwangi", 
    "UKM Pilar Bangsa", 
    "Pilar Bangsa Digital Office",
    "Sistem Manajemen Pilar Bangsa"
  ],
  openGraph: {
    title: "Unit Kegiatan Mahasiswa: Pilar Bangsa Untag Banyuwangi",
    description: "Wadah Transformasi & Kolaborasi Mahasiswa Universitas 17 Agustus 1945 (Untag) Banyuwangi. Pilar Bangsa Digital Office mewujudkan tata kelola organisasi yang modern, transparan, dan akuntabel.",
    url: "https://www.pilarbangsa.my.id",
    siteName: "UKM Pilar Bangsa Untag Banyuwangi",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/og-image.webp",
        width: 1200,
        height: 630,
        alt: "UKM Pilar Bangsa Untag Banyuwangi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Unit Kegiatan Mahasiswa: Pilar Bangsa Untag Banyuwangi",
    description: "Wadah Transformasi & Kolaborasi Mahasiswa Universitas 17 Agustus 1945 (Untag) Banyuwangi. Pilar Bangsa Digital Office mewujudkan tata kelola organisasi yang modern, transparan, dan akuntabel.",
    images: ["/og-image.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SplashScreenWrapper />
        {children}
      </body>
    </html>
  );
}
