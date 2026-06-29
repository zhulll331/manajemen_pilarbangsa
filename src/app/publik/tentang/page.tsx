import React from 'react'
import { Shield, BookOpen, Compass, Heart, Award, Users, Milestone, Anchor, CheckCircle2 } from 'lucide-react'

export default function TentangPage() {
  return (
    <div className="space-y-24 py-8">
      {/* Header Section */}
      <section className="bg-black text-white rounded-3xl p-12 md:p-20 relative overflow-hidden shadow-2xl text-center">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#E31837] via-[#008000] to-[#FFD700]"></div>
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs md:text-sm font-bold tracking-widest uppercase border border-white/20">
            <span>Profil Organisasi</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Mengenal Lebih Dekat UKM Pilar Bangsa
          </h1>
          <p className="text-lg sm:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Wadah pembinaan kepemimpinan dan manajerial mahasiswa berlandaskan semangat kebangsaan dan profesionalisme.
          </p>
        </div>
      </section>

      {/* Sejarah Berdirinya Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-red-50 text-[#E31837] text-xs font-bold tracking-widest uppercase border border-red-100">
            <Milestone className="w-4 h-4" />
            <span>Titik Mula Sejarah</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Berdiri Tegak Sejak 20 April 2021
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            UKM Pilar Bangsa lahir dari sebuah refleksi mendalam para aktivis mahasiswa pada tanggal <span className="font-bold text-[#E31837]">20 April 2021</span>. Di tengah pesatnya disrupsi digital, dibutuhkan sebuah wadah organisasi yang mampu memadukan kecakapan tata kelola digital dengan integritas nilai-nilai luhur kebangsaan.
          </p>
          <p className="text-gray-700 text-base leading-relaxed">
            Sejak berdirinya, UKM Pilar Bangsa berfokus pada pengembangan ekosistem keorganisasian yang terstruktur, transparan dalam hal pengelolaan program kerja serta keuangan, dan aktif berkolaborasi dengan berbagai elemen kampus maupun pemangku kepentingan eksternal.
          </p>
        </div>
        <div className="bg-gray-50 p-8 sm:p-12 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-center space-y-8">
          <h3 className="text-2xl font-bold text-gray-900 border-l-4 border-[#E31837] pl-4">
            Tonggak Komitmen Organisasi
          </h3>
          <ul className="space-y-4 text-gray-700">
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="w-6 h-6 text-[#008000] flex-shrink-0 mt-0.5" />
              <span><strong className="text-gray-900">Digitalisasi Tatakelola:</strong> Beralih dari sistem konvensional menuju platform terpadu Pilar Digital Office.</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="w-6 h-6 text-[#008000] flex-shrink-0 mt-0.5" />
              <span><strong className="text-gray-900">Transparansi Nyata:</strong> Masyarakat dan mahasiswa dapat memantau secara langsung status setiap program kerja.</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="w-6 h-6 text-[#008000] flex-shrink-0 mt-0.5" />
              <span><strong className="text-gray-900">Pengkaderan Berkualitas:</strong> Mencetak calon-calon pemimpin masa depan yang kompeten dan berkarakter.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Makna Lambang dan Warna Section */}
      <section className="bg-gray-900 text-white rounded-3xl p-8 sm:p-16 shadow-2xl space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-white/10 text-white border border-white/20">
            Filosofi Visual
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Makna Lambang & Palet Warna
          </h2>
          <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
            Identitas visual UKM Pilar Bangsa mengusung kombinasi elegan antara warna dasar keorganisasian dengan aksen luhur lambang Universitas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 pt-4">
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-black border-2 border-white/20 shadow-md"></div>
            <h4 className="font-bold text-white text-lg">Hitam</h4>
            <p className="text-xs text-gray-300 leading-relaxed">Melambangkan ketegasan, kekuatan tekad, dan kedalaman ilmu pengetahuan.</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-300 shadow-md"></div>
            <h4 className="font-bold text-white text-lg">Putih</h4>
            <p className="text-xs text-gray-300 leading-relaxed">Melambangkan kesucian niat, kebersihan integritas, dan transparansi organisasi.</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#E31837] shadow-lg shadow-red-500/30"></div>
            <h4 className="font-bold text-[#E31837] text-lg">Merah</h4>
            <p className="text-xs text-gray-300 leading-relaxed">Melambangkan keberanian, dinamika perjuangan, dan semangat pantang menyerah.</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#008000] shadow-lg shadow-green-500/30"></div>
            <h4 className="font-bold text-[#008000] text-lg">Hijau</h4>
            <p className="text-xs text-gray-300 leading-relaxed">Melambangkan kesuburan, pertumbuhan yang berkelanjutan, dan kedamaian.</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FFD700] shadow-lg shadow-yellow-500/30"></div>
            <h4 className="font-bold text-[#FFD700] text-lg">Kuning</h4>
            <p className="text-xs text-gray-300 leading-relaxed">Melambangkan keagungan, masa depan yang cerah, dan keluhuran budi pekerti.</p>
          </div>
        </div>
      </section>

      {/* Tri Dharma & Trisakti Section */}
      <section className="space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-gray-100 text-gray-800 border border-gray-200">
            Nilai-Nilai Penggerak
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Tri Dharma & Trisakti Sukarno
          </h2>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
            Sinergi antara tanggung jawab insan akademis dengan visi besar bapak bangsa untuk mencapai kejayaan Indonesia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* 3 Pilar Tri Dharma */}
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-xl space-y-6">
            <div className="flex items-center space-x-4 border-b border-gray-100 pb-6">
              <div className="w-14 h-14 bg-green-50 text-[#008000] rounded-2xl flex items-center justify-center font-extrabold text-xl shadow-inner">
                III
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Tri Dharma Perguruan Tinggi</h3>
                <p className="text-gray-500 text-sm">3 Pilar Pengabdian Mahasiswa</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-1">
                <h4 className="text-lg font-extrabold text-gray-900 flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-[#008000]" />
                  <span>1. Pembelajaran (Pendidikan)</span>
                </h4>
                <p className="text-gray-600 text-sm pl-7 leading-relaxed">Mengembangkan keilmuan dan kompetensi mahasiswa melalui kajian, seminar, dan diskusi aktif.</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-extrabold text-gray-900 flex items-center space-x-2">
                  <Compass className="w-5 h-5 text-[#008000]" />
                  <span>2. Penelitian (Riset & Inovasi)</span>
                </h4>
                <p className="text-gray-600 text-sm pl-7 leading-relaxed">Mencari solusi praktis dan inovatif terhadap berbagai permasalahan sosial dan teknologi.</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-extrabold text-gray-900 flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-[#008000]" />
                  <span>3. Pengabdian kepada Masyarakat</span>
                </h4>
                <p className="text-gray-600 text-sm pl-7 leading-relaxed">Mendedikasikan waktu, tenaga, and pemikiran guna membantu mensejahterakan masyarakat sekitar.</p>
              </div>
            </div>
          </div>

          {/* Trisakti Sukarno */}
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-xl space-y-6">
            <div className="flex items-center space-x-4 border-b border-gray-100 pb-6">
              <div className="w-14 h-14 bg-amber-50 text-[#FFD700] rounded-2xl flex items-center justify-center font-extrabold text-xl shadow-inner">
                3
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Trisakti Sukarno</h3>
                <p className="text-gray-500 text-sm">Atap Pijakan Arah Juang Bangsa</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-1">
                <h4 className="text-lg font-extrabold text-gray-900 flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-amber-500" />
                  <span>1. Berdaulat dalam Politik</span>
                </h4>
                <p className="text-gray-600 text-sm pl-7 leading-relaxed">Membangun kesadaran hukum, politik, dan kebangsaan agar mahasiswa menjadi agen kontrol sosial yang independen.</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-extrabold text-gray-900 flex items-center space-x-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>2. Berdikari dalam Ekonomi</span>
                </h4>
                <p className="text-gray-600 text-sm pl-7 leading-relaxed">Mengembangkan jiwa kewirausahaan (entrepreneurship) dan kemandirian finansial organisasi.</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-extrabold text-gray-900 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  <span>3. Berkepribadian dalam Kebudayaan</span>
                </h4>
                <p className="text-gray-600 text-sm pl-7 leading-relaxed">Melestarikan kearifan lokal dan bangga mencerminkan karakter budaya bangsa di dunia internasional.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
