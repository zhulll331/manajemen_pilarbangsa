import React from 'react'
import { HeroSlider } from '@/components/HeroSlider'
import { TimelineRoadmap } from '@/components/TimelineRoadmap'
import { Award, BookOpen, Compass, Shield, Users, Target, Milestone, Anchor, Heart, Sparkles } from 'lucide-react'
import { GeminiPromptBox } from '@/components/GeminiPromptBox'

export default function BerandaPage() {
  return (
    <div className="space-y-24">
      {/* Hero Banner Section */}
      <section>
        <HeroSlider />
      </section>

      {/* Timeline Roadmap Section (Tepat Di Bawah Hero Banner & Di Atas Sejarah) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TimelineRoadmap />
      </section>

      {/* Tentang Kami & Sejarah Section */}
      <section id="tentang" className="scroll-mt-24 bg-gray-50 rounded-3xl p-8 sm:p-12 md:p-16 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-gray-100 to-transparent rounded-full -z-10 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-black text-white text-xs md:text-sm font-bold tracking-wider uppercase shadow-md">
            <Milestone className="w-4 h-4 text-[#FFD700]" />
            <span>Sejarah & Pendirian</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Menempa Kepemimpinan Sejak 20 April 2021
          </h2>

          <p className="text-lg sm:text-xl text-gray-700 leading-relaxed max-w-3xl mx-auto">
            UKM <span className="font-bold text-black">Pilar Bangsa</span> didirikan secara resmi pada tanggal <span className="font-bold text-[#E31837]">20 April 2021</span>. Berangkat dari semangat juang mahasiswa untuk menghadirkan wadah kepemimpinan yang progresif, transparan, dan berdampak nyata bagi lingkungan perguruan tinggi dan masyarakat luas.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-3 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-50 text-[#E31837] rounded-xl flex items-center justify-center font-extrabold text-xl">
                01
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Tata Kelola Modern</h3>
              <p className="text-gray-600 text-sm">Sistem terpadu berbasis digital untuk kemudahan transparansi publik.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-3 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-50 text-[#008000] rounded-xl flex items-center justify-center font-extrabold text-xl">
                02
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Integritas Bangsa</h3>
              <p className="text-gray-600 text-sm">Menjunjung tinggi falsafah negara dalam setiap gerak program kerja.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-3 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center font-extrabold text-xl">
                03
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Daya Saing Unggul</h3>
              <p className="text-gray-600 text-sm">Membekali pengurus dan anggota dengan kompetensi profesional masa depan.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Visualisasi Arsitektur Pilar Bangsa Section */}
      <section className="space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-block px-4 py-1.5 rounded-full text-xs md:text-sm font-bold tracking-wider uppercase bg-gray-100 text-gray-800 border border-gray-200">
            Struktur Konseptual Organisasi
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Bangunan Berdiri Pilar Bangsa
          </h2>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
            Organisasi ini dikonstruksikan layaknya sebuah rumah agung yang ditopang oleh 4 Pondasi Kokoh, 3 Pilar Penggerak, dan dinaungi oleh Atap Segitiga Trisakti.
          </p>
        </div>

        {/* The Architectural Visualization (Atap -> Pilar -> Pondasi) */}
        <div className="max-w-5xl mx-auto flex flex-col items-center space-y-8 px-4">
          
          {/* 1. ATAP SEGITIGA (Trisakti Sukarno) */}
          <div className="w-full max-w-3xl bg-black text-white rounded-t-3xl rounded-b-xl p-8 sm:p-12 shadow-2xl relative overflow-hidden border-t-8 border-[#FFD700] text-center transform hover:scale-[1.01] transition-transform duration-300">
            <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-48 h-48 bg-[#FFD700]/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col items-center space-y-4 relative z-10">
              <div className="px-4 py-1 rounded-full bg-[#FFD700]/20 text-[#FFD700] text-xs font-bold uppercase tracking-widest border border-[#FFD700]/30">
                Atap Segitiga
              </div>
              
              <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Trisakti Sukarno
              </h3>
              
              <p className="text-gray-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                Sebagai naungan tertinggi yang menjadi cita-cita arah gerak pergerakan mahasiswa dalam menjaga kehormatan dan kemandirian bangsa.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-6">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 hover:bg-white/20 transition-colors">
                  <div className="font-extrabold text-[#FFD700] text-lg mb-1">Berdaulat</div>
                  <div className="text-xs text-gray-300 font-medium">Dalam Bidang Politik</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 hover:bg-white/20 transition-colors">
                  <div className="font-extrabold text-[#FFD700] text-lg mb-1">Berdikari</div>
                  <div className="text-xs text-gray-300 font-medium">Dalam Bidang Ekonomi</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 hover:bg-white/20 transition-colors">
                  <div className="font-extrabold text-[#FFD700] text-lg mb-1">Berkepribadian</div>
                  <div className="text-xs text-gray-300 font-medium">Dalam Kebudayaan</div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 3 PILAR (Pembelajaran, Penelitian, Pengabdian) */}
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pilar 1: Pembelajaran */}
            <div className="bg-white rounded-2xl p-8 border-t-8 border-[#008000] shadow-xl border-x border-b border-gray-100 flex flex-col items-center text-center space-y-4 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-green-50 text-[#008000] rounded-2xl flex items-center justify-center shadow-inner">
                <BookOpen className="w-7 h-7" />
              </div>
              <div className="px-3 py-1 rounded-full bg-green-50 text-[#008000] text-xs font-bold uppercase tracking-widest">
                Pilar Pertama
              </div>
              <h4 className="text-2xl font-black text-gray-900">Pembelajaran</h4>
              <p className="text-gray-600 text-sm leading-relaxed flex-grow">
                Pendidikan berkelanjutan guna meningkatkan kapasitas intelektual, kepemimpinan, dan etika profesional para mahasiswa.
              </p>
            </div>

            {/* Pilar 2: Penelitian */}
            <div className="bg-white rounded-2xl p-8 border-t-8 border-[#008000] shadow-xl border-x border-b border-gray-100 flex flex-col items-center text-center space-y-4 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-green-50 text-[#008000] rounded-2xl flex items-center justify-center shadow-inner">
                <Compass className="w-7 h-7" />
              </div>
              <div className="px-3 py-1 rounded-full bg-green-50 text-[#008000] text-xs font-bold uppercase tracking-widest">
                Pilar Kedua
              </div>
              <h4 className="text-2xl font-black text-gray-900">Penelitian</h4>
              <p className="text-gray-600 text-sm leading-relaxed flex-grow">
                Penjelajahan riset dan pengembangan keilmuan untuk melahirkan solusi inovatif yang adaptif terhadap perkembangan teknologi.
              </p>
            </div>

            {/* Pilar 3: Pengabdian */}
            <div className="bg-white rounded-2xl p-8 border-t-8 border-[#008000] shadow-xl border-x border-b border-gray-100 flex flex-col items-center text-center space-y-4 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-green-50 text-[#008000] rounded-2xl flex items-center justify-center shadow-inner">
                <Heart className="w-7 h-7" />
              </div>
              <div className="px-3 py-1 rounded-full bg-green-50 text-[#008000] text-xs font-bold uppercase tracking-widest">
                Pilar Ketiga
              </div>
              <h4 className="text-2xl font-black text-gray-900">Pengabdian</h4>
              <p className="text-gray-600 text-sm leading-relaxed flex-grow">
                Aksi nyata dan advokasi sosial untuk mensejahterakan masyarakat, mengamalkan ilmu pengetahuan demi kemaslahatan bersama.
              </p>
            </div>

          </div>

          {/* 3. 4 PONDASI (Pancasila, UUD 1945, NKRI, Bhinneka Tunggal Ika) */}
          <div className="w-full max-w-5xl bg-gray-900 text-white rounded-b-3xl rounded-t-xl p-8 sm:p-12 shadow-2xl relative overflow-hidden border-b-8 border-[#E31837] text-center transform hover:scale-[1.01] transition-transform duration-300">
            <div className="absolute bottom-0 left-0 translate-x-12 translate-y-12 w-48 h-48 bg-[#E31837]/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col items-center space-y-6 relative z-10">
              <div className="px-4 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest border border-red-500/30">
                4 Pondasi Kebangsaan
              </div>

              <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Pondasi Berdirinya Organisasi
              </h3>

              <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                Empat Konsensus Dasar Nasional yang menjadi alas pijak abadi bagi seluruh pengurus dan anggota UKM Pilar Bangsa dalam setiap gerak keorganisasian.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full pt-4">
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 hover:bg-white/20 transition-all flex flex-col items-center text-center space-y-2">
                  <Shield className="w-8 h-8 text-[#E31837]" />
                  <h4 className="font-extrabold text-white text-lg tracking-wide">Pancasila</h4>
                  <p className="text-xs text-gray-300 font-medium">Sumber dari segala sumber hukum dan pandangan hidup.</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 hover:bg-white/20 transition-all flex flex-col items-center text-center space-y-2">
                  <Award className="w-8 h-8 text-[#E31837]" />
                  <h4 className="font-extrabold text-white text-lg tracking-wide">UUD 1945</h4>
                  <p className="text-xs text-gray-300 font-medium">Landasan konstitusional dan pijakan hukum tertinggi.</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 hover:bg-white/20 transition-all flex flex-col items-center text-center space-y-2">
                  <Anchor className="w-8 h-8 text-[#E31837]" />
                  <h4 className="font-extrabold text-white text-lg tracking-wide">NKRI</h4>
                  <p className="text-xs text-gray-300 font-medium">Bentuk ikatan kesatuan negara yang utuh dan berdaulat.</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 hover:bg-white/20 transition-all flex flex-col items-center text-center space-y-2">
                  <Users className="w-8 h-8 text-[#E31837]" />
                  <h4 className="font-extrabold text-white text-lg tracking-wide">Bhinneka Tunggal Ika</h4>
                  <p className="text-xs text-gray-300 font-medium">Persatuan dalam keberagaman suku, agama, dan ras.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-black text-white rounded-3xl p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#E31837_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Transparansi Program Kerja & Dokumentasi
          </h2>
          <p className="text-gray-300 text-lg sm:text-xl leading-relaxed">
            Sebagai wujud akuntabilitas, seluruh kegiatan dan dokumentasi proker UKM Pilar Bangsa dapat dipantau secara langsung oleh publik.
          </p>
          <div>
            <a 
              href="/program-kerja" 
              className="inline-flex items-center space-x-3 bg-white text-black font-extrabold px-9 py-4 rounded-2xl shadow-xl hover:bg-gray-100 transition-all duration-300 hover:-translate-y-1 text-lg"
            >
              <span>Lihat Daftar Program Kerja</span>
            </a>
          </div>
        </div>
      </section>

      {/* AI Co-Pilot / Gemini Prompt Box Section */}
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
        <GeminiPromptBox />
      </section>
    </div>
  )
}
