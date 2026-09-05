import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { HeroSlider } from '@/components/HeroSlider'
import { TimelineRoadmap } from '@/components/TimelineRoadmap'
import { GeminiPromptBoxWrapper } from '@/components/GeminiPromptBoxWrapper'
import { ScrollReveal } from '@/components/ScrollReveal'
import { createClient } from '@supabase/supabase-js'
import { ArrowRight, Newspaper } from 'lucide-react'

export const metadata = {
  title: 'Pilar Bangsa Digital Office | UKM Pilar Bangsa Untag Banyuwangi',
  description: 'Wadah Transformasi & Kolaborasi Mahasiswa Universitas 17 Agustus 1945 (Untag) Banyuwangi. Mewujudkan tata kelola organisasi yang modern, transparan, dan akuntabel.',
  keywords: ['UKM Pilar Bangsa', 'Untag Banyuwangi', 'Pilar Bangsa Digital Office', 'Universitas 17 Agustus 1945 Banyuwangi', 'Organisasi Mahasiswa', 'Sistem Manajemen Pilar Bangsa'],
}

// Fetch news from Supabase
async function getNews() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data } = await supabase
    .from('news_links')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6)

  return data || []
}

export default async function BerandaPage() {
  const newsList = await getNews();

  return (
    <div className="space-y-24 overflow-hidden">
      {/* Hero Banner Section */}
      <section>
        <HeroSlider />
      </section>

      {/* Timeline Roadmap Section */}
      <ScrollReveal direction="up">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TimelineRoadmap />
        </section>
      </ScrollReveal>

      {/* Berita Seputar UKM Section */}
      <ScrollReveal direction="up" delay={0.2}>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-red-50 text-[#E31837] text-xs font-bold tracking-widest uppercase border border-red-100">
              <Newspaper className="w-4 h-4" />
              <span>Kabar Terkini</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              Berita Seputar UKM
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Ikuti terus perkembangan dan kegiatan terbaru dari UKM Pilar Bangsa.
            </p>
          </div>

          {newsList.length > 0 ? (
            <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-8 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsList.map((news) => (
                <a 
                  key={news.id} 
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="snap-center shrink-0 w-[85vw] sm:w-[350px] md:w-auto bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 group flex flex-col"
                >
                  <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-gray-100">
                    <img 
                      src={news.image_url} 
                      alt={news.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="font-bold text-gray-900 text-lg leading-snug group-hover:text-[#E31837] transition-colors line-clamp-3 mb-4">
                      {news.title}
                    </h3>
                    <div className="mt-auto flex items-center text-sm font-semibold text-[#008000] group-hover:text-[#E31837] transition-colors">
                      Baca selengkapnya
                      <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-gray-50 rounded-3xl border border-gray-100">
              <p className="text-gray-500">Belum ada berita terbaru saat ini.</p>
            </div>
          )}
        </section>
      </ScrollReveal>

      {/* Call to Action Section */}
      <ScrollReveal direction="up">
        <section className="bg-black text-white rounded-3xl p-12 md:p-20 text-center relative overflow-hidden shadow-2xl mx-4 sm:mx-6 lg:mx-8 max-w-7xl xl:mx-auto">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#E31837_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Transparansi Program Kerja & Dokumentasi
            </h2>
            <p className="text-gray-300 text-lg sm:text-xl leading-relaxed">
              Sebagai wujud akuntabilitas, seluruh kegiatan dan dokumentasi proker UKM Pilar Bangsa dapat dipantau secara langsung oleh publik.
            </p>
            <div>
              <Link 
                href="/program-kerja" 
                className="inline-flex items-center space-x-3 bg-white text-black font-extrabold px-9 py-4 rounded-2xl shadow-xl hover:bg-gray-100 transition-all duration-300 hover:-translate-y-1 text-lg"
              >
                <span>Lihat Daftar Program Kerja</span>
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* AI Co-Pilot / Gemini Prompt Box Section */}
      <ScrollReveal direction="up">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-green-50 text-[#008000] text-xs sm:text-sm font-bold tracking-wider uppercase border border-green-200">
              <span>✨ AI CO-PILOT UKM PILAR BANGSA</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Tanyakan Apapun Seputar Proker & Organisasi
            </h3>
            <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
              Pilar Asisten AI didukung oleh model Google Gemini mutakhir untuk menjawab pertanyaan Anda berdasarkan dokumen AD/ART dan data real-time Supabase.
            </p>
          </div>
          <GeminiPromptBoxWrapper />
        </section>
      </ScrollReveal>
      
      {/* Global Style for hiding scrollbar in Webkit */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  )
}
