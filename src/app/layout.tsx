import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import dynamic from 'next/dynamic';
const SplashScreen = dynamic(() => import("@/components/SplashScreen").then((mod) => mod.SplashScreen), { ssr: false });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
