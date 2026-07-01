import React from 'react'
import Image from 'next/image'
import { Shield, BookOpen, Compass, Heart, Award, Users, Milestone, Anchor, CheckCircle2, Search, TrendingUp, Sparkles, Flag, Target } from 'lucide-react'

export default function TentangPage() {
  return (
    <div className="space-y-24 py-8">
      {/* Header Section */}
      <section className="bg-black text-white rounded-3xl p-12 md:p-20 relative overflow-hidden shadow-2xl text-center">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#E31837] via-[#008000] to-[#FFD700]"></div>
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs md:text-sm font-bold tracking-widest uppercase border border-white/20">
            <span>Profil & Arah Juang Organisasi</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Mengenal Lebih Dekat UKM Pilar Bangsa
          </h1>
          <p className="text-lg sm:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Wadah pembinaan kepemimpinan dan manajerial mahasiswa berlandaskan semangat kebangsaan, riset, dan pengabdian masyarakat.
          </p>
        </div>
      </section>

      {/* Sejarah Berdirinya & Lahirnya Digital Office Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-red-50 text-[#E31837] text-xs font-bold tracking-widest uppercase border border-red-100">
            <Milestone className="w-4 h-4" />
            <span>Titik Mula Sejarah & Transformasi Digital</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Berdiri Sejak 20 April 2021, Bertransformasi Digital pada 2026/2027
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed">
            UKM Pilar Bangsa lahir dari sebuah refleksi mendalam para aktivis mahasiswa pada tanggal <span className="font-bold text-[#E31837]">20 April 2021</span>. Berangkat dari semangat juang untuk menghadirkan wadah organisasi kemahasiswaan yang progresif, independen, dan berakar pada nilai-nilai luhur kebangsaan.
          </p>
          <p className="text-gray-700 text-base leading-relaxed bg-gray-50 p-6 rounded-2xl border-l-4 border-black">
            <strong className="text-black block mb-2">Transformasi Pilar Digital Office (Periode 2026/2027)</strong>
            Sebagai wujud komitmen nyata dalam mewujudkan tata kelola organisasi yang berdaya saing global, UKM Pilar Bangsa melakukan lompatan besar pada <span className="font-bold text-[#E31837]">Periode 2026/2027</span> melalui inisiasi dan peluncuran platform terpadu <span className="font-bold text-black">Pilar Digital Office</span>. Platform ini lahir sebagai perwujudan langsung dari <span className="font-bold text-black">Misi ke-2 Kepengurusan</span>, yakni mengembangkan tata kelola organisasi yang modern, efektif, efisien, serta menjamin transparansi arsip dan kegiatan bagi publik.
          </p>
        </div>
        <div className="bg-gray-50 p-8 sm:p-12 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-center space-y-8">
          <h3 className="text-2xl font-bold text-gray-900 border-l-4 border-[#E31837] pl-4">
            Tonggak Komitmen Organisasi
          </h3>
          <ul className="space-y-4 text-gray-700">
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="w-6 h-6 text-[#008000] flex-shrink-0 mt-0.5" />
              <span><strong className="text-gray-900">Digitalisasi Tatakelola:</strong> Beralih dari sistem konvensional menuju platform terpadu Pilar Digital Office (Misi ke-2 Kepengurusan 2026/2027).</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="w-6 h-6 text-[#008000] flex-shrink-0 mt-0.5" />
              <span><strong className="text-gray-900">Transparansi Nyata:</strong> Masyarakat dan civitas akademika dapat memantau secara langsung status dan kelengkapan arsip setiap program kerja.</span>
            </li>
            <li className="flex items-start space-x-3">
              <CheckCircle2 className="w-6 h-6 text-[#008000] flex-shrink-0 mt-0.5" />
              <span><strong className="text-gray-900">Pengkaderan Berkualitas:</strong> Mencetak calon-calon pemimpin masa depan yang kompeten, adaptif teknologi, dan berkarakter kebangsaan.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* VISI & MISI KEPENGURUSAN 2026/2027 SECTION */}
      <section className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white rounded-3xl p-8 sm:p-16 shadow-2xl relative overflow-hidden space-y-16 border-t-8 border-[#FFD700]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(#E31837_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

        {/* Visi */}
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md text-[#FFD700] text-xs sm:text-sm font-black tracking-widest uppercase border border-white/20 shadow-lg">
            <Flag className="w-4 h-4" />
            <span>Visi Kepengurusan Periode 2026/2027</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Menjadikan UKM Pilar Bangsa sebagai wadah pengembangan intelektualitas, riset, dan pengabdian mahasiswa yang inklusif, adaptif terhadap perkembangan teknologi, serta berorientasi pada kolaborasi lintas disiplin demi terwujudnya kontribusi nyata bagi civitas akademika dan masyarakat.
          </h2>
        </div>

        {/* Misi */}
        <div className="border-t border-white/10 pt-12 max-w-5xl mx-auto space-y-12 relative z-10">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center space-x-2 px-6 py-2 rounded-full bg-[#E31837] text-white text-xs sm:text-sm font-black tracking-widest uppercase shadow-lg shadow-red-500/30">
              <Target className="w-4 h-4" />
              <span>Misi Kepengurusan Periode 2026/2027</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              5 Pilar Misi & Landasan Konstitusional AD/ART
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Misi 1 */}
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-all shadow-xl flex flex-col md:flex-row gap-6 items-start">
              <div className="w-14 h-14 bg-[#E31837] text-white font-extrabold text-2xl rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 flex-shrink-0">
                01
              </div>
              <div className="space-y-4 flex-grow">
                <h4 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Mewujudkan ekosistem organisasi yang inklusif, kekeluargaan, dan sinergis.
                </h4>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                  UKM Pilar Bangsa harus menjadi ruang yang terbuka bagi mahasiswa dari berbagai fakultas untuk berkolaborasi, menyatukan gagasan, serta membangun budaya organisasi yang saling mendukung dan kekeluargaan.
                </p>
                <div className="inline-block px-4 py-1.5 rounded-xl bg-white/10 text-[#FFD700] text-xs font-extrabold tracking-wider border border-white/20">
                  Landasan AD/ART: Pasal 5
                </div>
              </div>
            </div>

            {/* Misi 2 */}
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-all shadow-xl flex flex-col md:flex-row gap-6 items-start border-l-8 border-l-[#008000]">
              <div className="w-14 h-14 bg-[#008000] text-white font-extrabold text-2xl rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 flex-shrink-0">
                02
              </div>
              <div className="space-y-4 flex-grow">
                <h4 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Mengembangkan tata kelola organisasi yang modern, efektif, dan efisien.
                </h4>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                  Pengelolaan administrasi, data anggota, presensi, arsip, agenda, dan evaluasi kegiatan perlu diarahkan menuju sistem yang lebih rapi dan digital agar kerja organisasi menjadi lebih tertata, transparan, dan berkelanjutan.
                </p>
                <div className="inline-block px-4 py-1.5 rounded-xl bg-white/10 text-[#FFD700] text-xs font-extrabold tracking-wider border border-white/20">
                  Landasan AD/ART: Pasal 6 ayat (2)
                </div>
                <div className="mt-2 text-xs text-green-400 font-extrabold flex items-center space-x-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Misi inilah yang menjadi cikal bakal berdirinya Pilar Digital Office ini.</span>
                </div>
              </div>
            </div>

            {/* Misi 3 */}
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-all shadow-xl flex flex-col md:flex-row gap-6 items-start">
              <div className="w-14 h-14 bg-[#FFD700] text-black font-extrabold text-2xl rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30 flex-shrink-0">
                03
              </div>
              <div className="space-y-4 flex-grow">
                <h4 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Meningkatkan kapasitas anggota melalui pembelajaran, riset, dan pengembangan keterampilan.
                </h4>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                  UKM Pilar Bangsa tidak hanya menjadi tempat menjalankan program kerja, tetapi juga menjadi ruang belajar bagi anggota untuk mengembangkan soft skill, hard skill, kepemimpinan, literasi digital, kemampuan riset, dan kepedulian sosial.
                </p>
                <div className="inline-block px-4 py-1.5 rounded-xl bg-white/10 text-[#FFD700] text-xs font-extrabold tracking-wider border border-white/20">
                  Landasan AD/ART: Pasal 4, Pasal 5, dan Pasal 6 ayat (3)
                </div>
              </div>
            </div>

            {/* Misi 4 */}
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-all shadow-xl flex flex-col md:flex-row gap-6 items-start">
              <div className="w-14 h-14 bg-[#E31837] text-white font-extrabold text-2xl rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 flex-shrink-0">
                04
              </div>
              <div className="space-y-4 flex-grow">
                <h4 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Memperkuat kolaborasi internal dan eksternal organisasi.
                </h4>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                  Membangun kemitraan strategis yang sinergis antardivisi di dalam internal organisasi serta mempererat relasi eksternal dengan universitas, alumni, media, dan pemangku kepentingan lainnya.
                </p>
                <div className="inline-block px-4 py-1.5 rounded-xl bg-white/10 text-[#FFD700] text-xs font-extrabold tracking-wider border border-white/20">
                  Landasan AD/ART: Pasal 10 ayat (2)
                </div>
              </div>
            </div>

            {/* Misi 5 */}
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-all shadow-xl flex flex-col md:flex-row gap-6 items-start">
              <div className="w-14 h-14 bg-[#008000] text-white font-extrabold text-2xl rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 flex-shrink-0">
                05
              </div>
              <div className="space-y-4 flex-grow">
                <h4 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Menghadirkan program pengabdian masyarakat yang inovatif, relevan, dan berdampak.
                </h4>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                  Setiap program kerja perlu diarahkan agar tidak hanya bersifat seremonial, tetapi benar-benar menjawab kebutuhan masyarakat, mengembangkan potensi lokal, serta membawa manfaat nyata bagi lingkungan kampus dan masyarakat.
                </p>
                <div className="inline-block px-4 py-1.5 rounded-xl bg-white/10 text-[#FFD700] text-xs font-extrabold tracking-wider border border-white/20">
                  Landasan AD/ART: Pasal 5 dan Pasal 6 ayat (3)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filosofi Logo Section */}
      <section className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-14 shadow-xl space-y-16">
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <div className="flex justify-center mb-8">
            <Image 
              src="/logo-ukm.png" 
              alt="Logo UKM Pilar Bangsa" 
              width={160} 
              height={160} 
              className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-xl"
              priority
            />
          </div>
          <div className="inline-block px-6 py-2 rounded-full text-xs font-extrabold tracking-widest uppercase bg-[#E31837] text-white shadow-md shadow-red-500/20">
            Filosofi Logo
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            UKM PILAR BANGSA
          </h2>
          <p className="text-gray-600 text-lg sm:text-xl leading-relaxed max-w-3xl mx-auto">
            Logo UKM Pilar Bangsa menggambarkan fondasi kebangsaan yang kokoh, semangat Tri Dharma Perguruan Tinggi, serta cita-cita luhur Trisakti Bung Karno untuk mewujudkan bangsa yang berdaulat, berdikari, dan berkepribadian.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          {/* 01: 4 Pondasi */}
          <div className="bg-white rounded-3xl border-2 border-red-100 p-8 shadow-lg hover:shadow-xl transition-shadow flex flex-col justify-between space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#E31837]"></div>
            <div className="space-y-6">
              <div className="flex items-center space-x-4 border-b border-gray-100 pb-6">
                <div className="w-14 h-14 bg-[#E31837] text-white rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-red-500/30 flex-shrink-0">
                  01
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">4 PONDASI</h3>
                  <p className="text-[#E31837] font-bold text-xs uppercase tracking-wider">Fondasi Kebangsaan</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#E31837] text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-red-500/20 mt-1">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-base">PANCASILA</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">Dasar negara dan ideologi bangsa Indonesia.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#E31837] text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-red-500/20 mt-1">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-base">UUD 1945</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">Konstitusi negara sebagai pedoman kehidupan berbangsa.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#E31837] text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-red-500/20 mt-1">
                    <Anchor className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-base">NKRI</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">Bentuk negara kesatuan yang menyatukan seluruh rakyat.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#E31837] text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-red-500/20 mt-1">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-base">BHINNEKA TUNGGAL IKA</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">Semboyan yang menegaskan persatuan dalam keberagaman.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 02: 3 Pilar */}
          <div className="bg-white rounded-3xl border-2 border-yellow-200 p-8 shadow-lg hover:shadow-xl transition-shadow flex flex-col justify-between space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FFD700]"></div>
            <div className="space-y-6">
              <div className="flex items-center space-x-4 border-b border-gray-100 pb-6">
                <div className="w-14 h-14 bg-[#FFD700] text-black rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-yellow-500/30 flex-shrink-0">
                  02
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">3 PILAR</h3>
                  <p className="text-amber-600 font-bold text-xs uppercase tracking-wider">Tri Dharma Perguruan Tinggi</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFD700] text-black flex items-center justify-center flex-shrink-0 shadow-md shadow-yellow-500/30 mt-1">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-base">PEMBELAJARAN</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">Proses pendidikan untuk mengembangkan ilmu dan karakter.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFD700] text-black flex items-center justify-center flex-shrink-0 shadow-md shadow-yellow-500/30 mt-1">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-base">PENELITIAN</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">Kegiatan ilmiah untuk mencari kebenaran dan inovasi.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFD700] text-black flex items-center justify-center flex-shrink-0 shadow-md shadow-yellow-500/30 mt-1">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-base">PENGABDIAN</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">Aksi nyata untuk memberi manfaat bagi masyarakat.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 03: Atap Segitiga */}
          <div className="bg-white rounded-3xl border-2 border-green-200 p-8 shadow-lg hover:shadow-xl transition-shadow flex flex-col justify-between space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#008000]"></div>
            <div className="space-y-6">
              <div className="flex items-center space-x-4 border-b border-gray-100 pb-6">
                <div className="w-14 h-14 bg-[#008000] text-white rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-green-500/30 flex-shrink-0">
                  03
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">ATAP SEGITIGA</h3>
                  <p className="text-[#008000] font-bold text-xs uppercase tracking-wider">Trisakti Sukarno</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#008000] text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-green-500/30 mt-1">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-base">BERDAULAT</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">Berdaulat di bidang politik untuk mewujudkan kedaulatan rakyat dan negara.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#008000] text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-green-500/30 mt-1">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-base">BERDIKARI</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">Berdikari di bidang ekonomi untuk kemandirian bangsa dan kesejahteraan rakyat.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#008000] text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-green-500/30 mt-1">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-base">BERKEPRIBADIAN</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">Berkepribadian di bidang budaya untuk membangun jati diri bangsa yang luhur.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Makna Dalam Satu Kesatuan */}
        <div className="border-t border-gray-100 pt-10 text-center max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="h-0.5 w-12 bg-[#E31837]"></div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">MAKNA DALAM SATU KESATUAN</h3>
            <div className="h-0.5 w-12 bg-[#E31837]"></div>
          </div>
          <p className="text-gray-700 text-lg sm:text-xl leading-relaxed font-medium">
            Empat pondasi kebangsaan menjadi dasar yang kokoh, tiga pilar Tri Dharma menjadi gerakan, dan Trisakti Sukarno menjadi cita luhur yang menaungi setiap langkah Pilar Bangsa.
          </p>
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
