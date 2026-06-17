export interface ArsipFile {
  name: string;
  category: string;
  subCategory?: string;
  type: string;
  path: string;
}

const BASE = "/arsip_lama";

function ext(filename: string): string {
  return filename.split(".").pop()?.toUpperCase() || "";
}

export const categories = [
  "Semua",
  "Surat",
  "SK",
  "Proposal",
  "LPJ",
  "Laporan Kegiatan",
  "Rekap Kehadiran",
  "AD-ART",
  "Pedoman",
  "Program Kerja",
] as const;

export type Category = (typeof categories)[number];

export const suratSubCategories = ["Semua Surat", "Surat Keluar", "Surat Masuk", "Surat Pengunduran Diri"] as const;
export const skSubCategories = ["Semua SK", "SK Final (PDF)", "Draft Advokasi", "Draft Humas", "Draft PKM", "Draft Riset & Penelitian"] as const;

export const arsipFiles: ArsipFile[] = [
  // ==================== SURAT KELUAR (91 file) ====================
  { name: "000. FORMAT KOP SURAT", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/000. FORMAT KOP SURAT.docx` },
  { name: "001. Surat Peminjaman Fasilitas", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/001. Surat Peminjaman Fasilitas.docx` },
  { name: "002. Berita Acara Struktural UKM Pilar Bangsa", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/002. Berita Acara Struktural UKM Pilar Bangsa.docx` },
  { name: "003. Berita Acara Rapat Kepengurusan Periode 2025-2026", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/003. Berita Acara Rapat Kepengurusan Periode 2025-2026.docx` },
  { name: "004. Surat Perizinan Survei Kecamatan Siliragung", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/004. Surat Perizinan Survei Kecamatan Siliragung.docx` },
  { name: "005. Surat Perizinan SDN 6 BULUAGUNG", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/005. Surat Perizinan SDN 6 BULUAGUNG.docx` },
  { name: "006. Berita Acara Rapat Keberlanjutan Survei Desa dan Kerjasama Eksternal", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/006. Berita Acara Rapat Keberlanjutan Survei Desa dan Kerjasama Eksternal.docx` },
  { name: "007. Surat Perizinan Survei Kecamatan Licin [1]", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/007. Surat Perizinan Survei Kecamatan Licin[1].docx` },
  { name: "008. Surat Perizinan SDN 1 PAKEL", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/008. Surat Perizinan SDN 1 PAKEL.docx` },
  { name: "009. Surat Perizinan Survei Kecamatan Licin [2]", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/009. Surat Perizinan Survei Kecamatan Licin [2].docx` },
  { name: "010. Surat Perizinan SDN 2 PAKEL", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/010. Surat Perizinan SDN 2 PAKEL.docx` },
  { name: "011. Surat Perizinan Survei Kecamatan Licin [3]", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/011. Surat Perizinan Survei Kecamatan Licin [3].docx` },
  { name: "012. Surat Perizinan SDN 3 PAKEL", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/012. Surat Perizinan SDN 3 PAKEL.docx` },
  { name: "013. Surat Perizinan Survei Kecamatan Tegaldlimo", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/013. Surat Perizinan Survei Kecamatan Tegaldlimo.docx` },
  { name: "014. Surat Perizinan SDN 4 KENDALREJO", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/014. Surat Perizinan SDN 4 KENDALREJO.docx` },
  { name: "015. Surat Perizinan Kecamatan Wongsorejo", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/015. Surat Perizinan Kecamatan Wongsorejo.docx` },
  { name: "016. Surat Perizinan Madrasah Ibtidaiyah Darul Faizin", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/016. Surat Perizinan Madrasah Ibtidaiyah Darul Faizin.docx` },
  { name: "017. Surat Perizinan Kecamatan Wongsorejo [2]", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/017. Surat Perizinan Kecamatan Wongsorejo [2].docx` },
  { name: "018. MI RIYADLUS SHOLIHIN", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/018. MI RIYADLUS SHOLIHIN.docx` },
  { name: "019. Surat Perizinan Survei Kecamatan Licin NEW [1]", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/019. Surat Perizinan Survei Kecamatan Licin NEW [1].docx` },
  { name: "020. Surat Perizinan Survei Kecamatan Licin NEW [2]", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/020. Surat Perizinan Survei Kecamatan Licin NEW [2].docx` },
  { name: "021. Surat Perizinan MI Sunan Giri", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/021. Surat Perizinan MI Sunan Giri.docx` },
  { name: "022. Surat Perizinan SDN 1 Tamansari", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/022. Surat Perizinan SDN 1 Tamansari.docx` },
  { name: "023. SURAT DISPENSASI SEMINAR STIKES", category: "Surat", subCategory: "Surat Keluar", type: "PDF", path: `${BASE}/SURAT/023. SURAT DISPENSASI SEMINAR STIKES.pdf` },
  { name: "025. Surat Peminjaman Fasilitas [1]", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/025. Surat Peminjaman Fasilitas[1].docx` },
  { name: "026. Surat Perizinan Tempat SDN 1 Kluncing", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/026.Surat Perizinan Tempat_SDN 1Kluncing.docx` },
  { name: "027. Surat Perizinan Tempat SDN 1 Tamansari", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/027.Surat Perizinan Tempat_SDN 1 Tamansari.docx` },
  { name: "028. Surat Perizinan Tempat SDN 1 Benelan Kidul", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/028.Surat Perizinan Tempat_ SDN1 Benelan Kidul.docx` },
  { name: "029. Surat Peminjaman Fasilitas", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/029.Surat Peminjaman Fasilitas.docx` },
  { name: "030. Berita Acara Rapat Hasil Survei Desa & Pembentukan Panitia 17 Agustus", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/030. Berita Acara Rapat Hasil Survei Desa & Pembentukan Panitia 17 Agustus.docx` },
  { name: "031. SK KEGIATAN 17 AGUSTUS 2025", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/031. SK KEGIATAN 17 AGUSTUS 2025.docx` },
  { name: "032. Undangan Demisioner Kegiatan 17 Agustus", category: "Surat", subCategory: "Surat Keluar", type: "PDF", path: `${BASE}/SURAT/032. Undangan Demisioner Kegiatan 17 Agustus.pdf` },
  { name: "033. Berita Acara Rapat Penyusunan Program Kerja", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/033. Berita Acara Rapat Penyusunan Program Kerja.docx` },
  { name: "034. Berita Acara Kegiatan 17 Agustus 2025", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/034. Berita Acara Kegiatan 17 Agustus 2025.docx` },
  { name: "035. Surat Observasi Pantai Bomo", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/035. Surat Observasi Pantai Bomo.docx` },
  { name: "036. Surat Observasi Pantai Cemara Gading", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/036. Surat Observasi Pantai Cemara Gading.docx` },
  { name: "037. Surat Peminjaman Fasilitas", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/037. Surat Peminjaman Fasilitas.docx` },
  { name: "038. Berita Acara Rapat Pembentukan Panitia Diklat & Pendampingan", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/038. Berita Acara Rapat Pembentukan Panitia Diklat & Pendampingan.docx` },
  { name: "039. SK Panitia Diklat 2025", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/039. SK Panitia Diklat 2025.docx` },
  { name: "040. Surat Observasi Desa Kelir", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/040. Surat Observasi Desa Kelir.docx` },
  { name: "041. Surat Observasi Omah Kopi", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/041. Surat Observasi Omah Kopi.docx` },
  { name: "042. Surat Peminjaman Fasilitas", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/042. Surat Peminjaman Fasilitas.docx` },
  { name: "043. Surat Peminjaman Fasilitas PKTI", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/043. Surat Peminjaman Fasilitas PKTI.docx` },
  { name: "044. Surat Permohonan Peminjaman Fasilitas", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/044. Surat Permohonan Peminjaman Fasilitas.docx` },
  { name: "045. Surat Undangan Demisioner", category: "Surat", subCategory: "Surat Keluar", type: "PDF", path: `${BASE}/SURAT/045. Surat Undangan Demisioner.pdf` },
  { name: "046. SK Panitia Pelatihan KTI", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/046. SK Panitia Pelatihan KTI.docx` },
  { name: "047. Surat Permohonan Narasumber", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/047. Surat Permohonan Narasumber.docx` },
  { name: "048. Surat Permohonan Narasumber", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/048. Surat Permohonan Narasumber.docx` },
  { name: "049. Surat Peminjaman Fasilitas PKTI", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/049. Surat Peminjaman Fasilitas PKTI.docx` },
  { name: "050. Surat Permohonan Narasumber", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/050. Surat Permohonan Narasumber.docx` },
  { name: "051. Surat Permohonan Narasumber", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/051. Surat Permohonan Narasumber.docx` },
  { name: "052. Surat Permohonan Narasumber", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/052. Surat Permohonan Narasumber.docx` },
  { name: "053. Surat Permohonan Narasumber", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/053. Surat Permohonan Narasumber.docx` },
  { name: "054. Berita Acara Diklat 2025", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/054. Berita Acara Diklat 2025.docx` },
  { name: "055. Berita Acara Pelatihan KTI", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/055. Berita Acara Pelatihan KTI.docx` },
  { name: "056. Surat Permohonan", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/056. Surat Permohonan.docx` },
  { name: "057. Surat Perizinan Wawancara Warek", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/057. Surat Perizinan Wawancara Warek.docx` },
  { name: "058. Surat Pemberitahuan Mahasiswa", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/058. Surat Pemberitahuan Mahasiswa.docx` },
  { name: "060. SK TIM RISET & PENELITIAN WASBANG", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/060. SK TIM RISET & PENELITIAN WASBANG.docx` },
  { name: "061. Surat Peminjaman Fasilitas", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/061. Surat Peminjaman Fasilitas.docx` },
  { name: "062. Surat Perizinan Wawancara Dosen", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/062. Surat Perizinan Wawancara Dosen.docx` },
  { name: "063. Surat Perizinan Wawancara Dosen", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/063. Surat Perizinan Wawancara Dosen.docx` },
  { name: "064. Surat Perizinan Wawancara Dosen", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/064. Surat Perizinan Wawancara Dosen.docx` },
  { name: "065. Berita Acara Rapat Pembagian Divisi", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/065. Berita Acara Rapat Pembagian Divisi.docx` },
  { name: "066. Surat Perizinan SDN 2 Telemung", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/066. Surat Perizinan SDN 2 Telemung.docx` },
  { name: "067. Surat Perizinan SDN 1 Kelir", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/067. Surat Perizinan SDN 1 Kelir.docx` },
  { name: "068. SK TIM MITRA DESA", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/068. SK TIM MITRA DESA.docx` },
  { name: "069. SK TIM UMKM", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/069. SK TIM UMKM.docx` },
  { name: "070. SK TIM PENDIDIKAN", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/070. SK TIM PENDIDIKAN.docx` },
  { name: "071. SK PANITIA KEGIATAN NGOVI", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/071. SK PANITIA KEGIATAN NGOVI.docx` },
  { name: "072. SK PANITIA KEGIATAN SENTUHAN KASIH PILAR BANGSA", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/072. SK PANITIA KEGIATAN SENTUHAN KASIH PILAR BANGSA.docx` },
  { name: "073. SK TIM PENELITIAN MENDUKUNG KOMPETISI NASIONAL", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/073. SK TIM PENELITIAN MENDUKUNG KOMPETISI NASIONAL.docx` },
  { name: "074. SK PANITIA PELATIHAN KTI APRIL 2026", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/074. SK PANITIA PELATIHAN KTI APRIL 2026.docx` },
  { name: "075. SK PANITIA SHARING SESSION", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/075. SK PANITIA SHARING SESSION.docx` },
  { name: "076. SK PANITIA JAREK BULAN DESEMBER", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/076. SK PANITIA JAREK BULAN DESEMBER.docx` },
  { name: "077. SK PANITIA JAREK BULAN MARET 2026", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/077. SK PANITIA JAREK BULAN MARET 2026.docx` },
  { name: "078. SK PANITIA UBF 2026", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/078. SK PANITIA UBF 2026.docx` },
  { name: "079. SK TIM PUBLIKASI ARTIKEL ILMIAH", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/079. SK TIM PUBLIKASI ARTIKEL ILMIAH.docx` },
  { name: "080. Surat Perizinan Mitra Desa", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/080. Surat Perizinan Mitra Desa.docx` },
  { name: "081. Surat Undangan Ibu PKK", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/081.Surat Undangan Ibu PKK.docx` },
  { name: "082. Surat Undangan Karang Taruna", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/082.Surat Undangan Karang Taruna.docx` },
  { name: "083. Surat Perizinan Omah Kopi", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/083.Surat Perizinan omah kopi.docx` },
  { name: "084. Surat Peminjaman Fasilitas JAREK", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/084. Surat Peminjaman Fasilitas JAREK.docx` },
  { name: "085. NOMOR SERTIFIKAT JAREK SESI 19", category: "Surat", subCategory: "Surat Keluar", type: "PNG", path: `${BASE}/SURAT/085. NOMOR SERTIFIKAT JAREK SESI 19.png` },
  { name: "086. Surat Undangan Demisioner Buka Bersama", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/086. Surat Undangan Demisioner Buka Bersama.docx` },
  { name: "087. Surat Perizinan Observasi Desa Kelir", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/087. Surat Perizinan Observasi Desa Kelir.docx` },
  { name: "088. Surat Perizinan Observasi Desa Alasmalang", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/088. Surat Perizinan Observasi Desa Alasmalang.docx` },
  { name: "089. Surat Peminjaman Fasilitas", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/089. Surat Peminjaman Fasilitas.docx` },
  { name: "090. Surat Peminjaman Fasilitas", category: "Surat", subCategory: "Surat Keluar", type: "DOCX", path: `${BASE}/SURAT/090. Surat Peminjaman Fasilitas.docx` },
  { name: "091. NOMOR SERTIFIKAT JAREK", category: "Surat", subCategory: "Surat Keluar", type: "PDF", path: `${BASE}/SURAT/091. NOMOR SERTIFIKAT JAREK.pdf` },
  { name: "092. Undangan Penutupan Pendampingan", category: "Surat", subCategory: "Surat Keluar", type: "PDF", path: `${BASE}/SURAT/092. Undangan Penutupan Pendampingan.pdf` },

  // ==================== SURAT MASUK (8 file) ====================
  { name: "025 Surat Peminjaman Pilar Bangsa", category: "Surat", subCategory: "Surat Masuk", type: "PDF", path: `${BASE}/SURAT/SURAT MASUK/025 Surat Peminjaman Pilar Bangsa.pdf` },
  { name: "SURAT PEMINJAMAN TIANG BENDERA", category: "Surat", subCategory: "Surat Masuk", type: "PDF", path: `${BASE}/SURAT/SURAT MASUK/SURAT PEMINJAMAN TIANG BENDERA.pdf` },
  { name: "SURAT UNDANGAN PILAR BANGSA", category: "Surat", subCategory: "Surat Masuk", type: "PDF", path: `${BASE}/SURAT/SURAT MASUK/SURAT UNDANGAN PILAR BANGSA.pdf` },
  { name: "Surat Undangan UKM PILAR BANGSA", category: "Surat", subCategory: "Surat Masuk", type: "DOCX", path: `${BASE}/SURAT/SURAT MASUK/Surat Undangan UKM PILAR BANGSA.docx` },
  { name: "UNDANGAN ORMAWA JUREK", category: "Surat", subCategory: "Surat Masuk", type: "PDF", path: `${BASE}/SURAT/SURAT MASUK/UNDANGAN ORMAWA JUREK.pdf` },
  { name: "UNDANGAN ORMAWA UNIV 14", category: "Surat", subCategory: "Surat Masuk", type: "PDF", path: `${BASE}/SURAT/SURAT MASUK/UNDANGAN ORMAWA UNIV 14.pdf` },
  { name: "UNDANGAN ORMAWA UNIV", category: "Surat", subCategory: "Surat Masuk", type: "PDF", path: `${BASE}/SURAT/SURAT MASUK/UNDANGAN ORMAWA UNIV.pdf` },
  { name: "Undangan Konsolidasi", category: "Surat", subCategory: "Surat Masuk", type: "PDF", path: `${BASE}/SURAT/SURAT MASUK/Undangan Konsolidasi.pdf` },

  // ==================== SURAT PENGUNDURAN DIRI (1 file) ====================
  { name: "Surat Pengunduran Diri (Evi Dwi Wulandari)", category: "Surat", subCategory: "Surat Pengunduran Diri", type: "PDF", path: `${BASE}/SURAT/SURAT PENGUNDURAN DIRI/Surat Pengunduran Diri (Evi Dwi Wulandari).pdf` },

  // ==================== SK FINAL (11 file) ====================
  { name: "031. SK PANITIA KEGIATAN 17 AGUSTUS 2025", category: "SK", subCategory: "SK Final (PDF)", type: "PDF", path: `${BASE}/SK/SK FIX/031. SK PANITIA KEGIATAN 17 AGUSTUS 2025.pdf` },
  { name: "039. SK PANITIA DIKLAT 2025", category: "SK", subCategory: "SK Final (PDF)", type: "PDF", path: `${BASE}/SK/SK FIX/039. SK PANITIA DIKLAT 2025.pdf` },
  { name: "046. SK PANITIA PELATIHAN KTI", category: "SK", subCategory: "SK Final (PDF)", type: "PDF", path: `${BASE}/SK/SK FIX/046. SK PANITIA PELATIHAN KTI.pdf` },
  { name: "060. SK TIM RISET & PENELITIAN WASBANG", category: "SK", subCategory: "SK Final (PDF)", type: "PDF", path: `${BASE}/SK/SK FIX/060. SK TIM RISET & PENELITIAN WASBANG.pdf` },
  { name: "068. SK TIM MITRA DESA", category: "SK", subCategory: "SK Final (PDF)", type: "PDF", path: `${BASE}/SK/SK FIX/068. SK TIM MITRA DESA.pdf` },
  { name: "069. SK TIM UMKM", category: "SK", subCategory: "SK Final (PDF)", type: "PDF", path: `${BASE}/SK/SK FIX/069. SK TIM UMKM.pdf` },
  { name: "070. SK TIM PENDIDIKAN", category: "SK", subCategory: "SK Final (PDF)", type: "PDF", path: `${BASE}/SK/SK FIX/070. SK TIM PENDIDIKAN.pdf` },
  { name: "073. SK TIM PENELITIAN MENDUKUNG KOMPETISI NASIONAL", category: "SK", subCategory: "SK Final (PDF)", type: "PDF", path: `${BASE}/SK/SK FIX/073. SK TIM PENELITIAN MENDUKUNG KOMPETISI NASIONAL.pdf` },
  { name: "075. SK PANITIA SHARING SESSION", category: "SK", subCategory: "SK Final (PDF)", type: "PDF", path: `${BASE}/SK/SK FIX/075. SK PANITIA SHARING SESSION.pdf` },
  { name: "076. SK PANITIA JAREK BULAN DESEMBER", category: "SK", subCategory: "SK Final (PDF)", type: "PDF", path: `${BASE}/SK/SK FIX/076. SK PANITIA JAREK BULAN DESEMBER.pdf` },
  { name: "077. SK PANITIA JAREK BULAN APRIL", category: "SK", subCategory: "SK Final (PDF)", type: "PDF", path: `${BASE}/SK/SK FIX/077. SK PANITIA JAREK BULAN APRIL.pdf` },

  // ==================== SK DRAFT ADVOKASI (6 file) ====================
  { name: "031. SK PANITIA KEGIATAN 17 AGUSTUS 2025 (Draft)", category: "SK", subCategory: "Draft Advokasi", type: "DOCX", path: `${BASE}/SK/DRAFT SK ADVOKASI/031. SK PANITIA KEGIATAN 17 AGUSTUS 2025.docx` },
  { name: "068. SK TIM MITRA DESA (Draft)", category: "SK", subCategory: "Draft Advokasi", type: "DOCX", path: `${BASE}/SK/DRAFT SK ADVOKASI/068. SK TIM MITRA DESA.docx` },
  { name: "069. SK TIM UMKM (Draft)", category: "SK", subCategory: "Draft Advokasi", type: "DOCX", path: `${BASE}/SK/DRAFT SK ADVOKASI/069. SK TIM UMKM.docx` },
  { name: "070. SK TIM PENDIDIKAN (Draft)", category: "SK", subCategory: "Draft Advokasi", type: "DOCX", path: `${BASE}/SK/DRAFT SK ADVOKASI/070. SK TIM PENDIDIKAN.docx` },
  { name: "071. SK PANITIA KEGIATAN NGOVI (Draft)", category: "SK", subCategory: "Draft Advokasi", type: "DOCX", path: `${BASE}/SK/DRAFT SK ADVOKASI/071. SK PANITIA KEGIATAN NGOVI.docx` },
  { name: "072. SK PANITIA KEGIATAN SENTUHAN KASIH (Draft)", category: "SK", subCategory: "Draft Advokasi", type: "DOCX", path: `${BASE}/SK/DRAFT SK ADVOKASI/072. SK PANITIA KEGIATAN SENTUHAN KASIH PILAR BANGSA.docx` },

  // ==================== SK DRAFT HUMAS (1 file) ====================
  { name: "079. SK TIM PUBLIKASI ARTIKEL ILMIAH (Draft)", category: "SK", subCategory: "Draft Humas", type: "DOCX", path: `${BASE}/SK/DRAFT SK HUMAS/079. SK TIM PUBLIKASI ARTIKEL ILMIAH.docx` },

  // ==================== SK DRAFT PKM (7 file) ====================
  { name: "039. SK PANITIA DIKLAT 2025 (Draft)", category: "SK", subCategory: "Draft PKM", type: "DOCX", path: `${BASE}/SK/DRAFT SK PKM/039. SK PANITIA DIKLAT 2025.docx` },
  { name: "046. SK PANITIA PELATIHAN KTI (Draft)", category: "SK", subCategory: "Draft PKM", type: "DOCX", path: `${BASE}/SK/DRAFT SK PKM/046. SK PANITIA PELATIHAN KTI.docx` },
  { name: "074. SK PANITIA PELATIHAN KTI APRIL 2026 (Draft)", category: "SK", subCategory: "Draft PKM", type: "DOCX", path: `${BASE}/SK/DRAFT SK PKM/074. SK PANITIA PELATIHAN KTI APRIL 2026.docx` },
  { name: "075. SK PANITIA SHARING SESSION (Draft)", category: "SK", subCategory: "Draft PKM", type: "DOCX", path: `${BASE}/SK/DRAFT SK PKM/075. SK PANITIA SHARING SESSION.docx` },
  { name: "076. SK PANITIA JAREK BULAN DESEMBER (Draft)", category: "SK", subCategory: "Draft PKM", type: "DOCX", path: `${BASE}/SK/DRAFT SK PKM/076. SK PANITIA JAREK BULAN DESEMBER.docx` },
  { name: "077. SK PANITIA JAREK BULAN MARET 2026 (Draft)", category: "SK", subCategory: "Draft PKM", type: "DOCX", path: `${BASE}/SK/DRAFT SK PKM/077. SK PANITIA JAREK BULAN MARET 2026.docx` },
  { name: "078. SK PANITIA UBF 2026 (Draft)", category: "SK", subCategory: "Draft PKM", type: "DOCX", path: `${BASE}/SK/DRAFT SK PKM/078. SK PANITIA UBF 2026.docx` },

  // ==================== SK DRAFT RISET & PENELITIAN (2 file) ====================
  { name: "060. SK TIM RISET & PENELITIAN WASBANG (Draft)", category: "SK", subCategory: "Draft Riset & Penelitian", type: "DOCX", path: `${BASE}/SK/DRAFT SK RISET & PENELITIAN/060. SK TIM RISET & PENELITIAN WASBANG.docx` },
  { name: "073. SK TIM PENELITIAN MENDUKUNG KOMPETISI NASIONAL (Draft)", category: "SK", subCategory: "Draft Riset & Penelitian", type: "DOCX", path: `${BASE}/SK/DRAFT SK RISET & PENELITIAN/073. SK TIM PENELITIAN MENDUKUNG KOMPETISI NASIONAL.docx` },

  // ==================== PROPOSAL (1 file) ====================
  { name: "PROPOSAL & ANGGARAN PELATIHAN KTI", category: "Proposal", type: "PDF", path: `${BASE}/PROPOSAL/PROPOSAL & ANGGARAN PELATIHAN KTI.pdf` },

  // ==================== LPJ (2 file) ====================
  { name: "LPJ UKM PILAR BANGSA PELATIHAN KTI", category: "LPJ", type: "PDF", path: `${BASE}/LPJ/LPJ UKM PILAR BANGSA PELATIHAN KTI.pdf` },
  { name: "LPJ WASBANG VOL III 2025", category: "LPJ", type: "PDF", path: `${BASE}/LPJ/LPJ WASBANG VOL III 2025.pdf` },

  // ==================== LAPORAN KEGIATAN (6 file) ====================
  { name: "LAPORAN KEGIATAN 17 AGUSTUS 2025", category: "Laporan Kegiatan", type: "DOCX", path: `${BASE}/LAPORAN KEGIATAN/LAPORAN KEGIATAN 17 AGUSTUS 2025.docx` },
  { name: "LAPORAN KEGIATAN DIKLAT ANGGOTA BARU 2025", category: "Laporan Kegiatan", type: "DOCX", path: `${BASE}/LAPORAN KEGIATAN/LAPORAN KEGIATAN DIKLAT ANGGOTA BARU 2025.docx` },
  { name: "LAPORAN UMKM OMAH KOPI TELEMUNG 2026", category: "Laporan Kegiatan", type: "DOCX", path: `${BASE}/LAPORAN KEGIATAN/LAPORAN UMKM OMAH KOPI TELEMUNG 2026.docx` },
  { name: "LAPORAN WASBANG VOL III", category: "Laporan Kegiatan", type: "DOCX", path: `${BASE}/LAPORAN KEGIATAN/LAPORAN WASBANG VOL III.docx` },
  { name: "Laporan Kegiatan Pendampingan Mitra Desa Kelir 2026", category: "Laporan Kegiatan", type: "DOCX", path: `${BASE}/LAPORAN KEGIATAN/Laporan Kegiatan Pendampingan Mitra Desa Kelir 2026.docx` },
  { name: "Laporan Pendampingan Pendidikan SDN 2 Telemung 2026", category: "Laporan Kegiatan", type: "DOCX", path: `${BASE}/LAPORAN KEGIATAN/Laporan Pendampingan_Pendidikan_SDN_2_Telemung_2026.docx` },

  // ==================== REKAP KEHADIRAN (2 file) ====================
  { name: "REKAP PRESENSI 17 AGUSTUS 2025", category: "Rekap Kehadiran", type: "DOCX", path: `${BASE}/REKAP KEHADIRAN/REKAP PRESENSI 17 AGUSTUS 2025.docx` },
  { name: "REKAP PRESENSI WASBANG", category: "Rekap Kehadiran", type: "DOCX", path: `${BASE}/REKAP KEHADIRAN/REKAP PRESENSI WASBANG.docx` },

  // ==================== AD-ART (1 file) ====================
  { name: "AD ART UKM PILAR BANGSA 2025-2026 [NEW]", category: "AD-ART", type: "DOCX", path: `${BASE}/AD-ART UKM PILAR BANGSA/AD ART UKM PILAR BANGSA 2025-2026 [NEW].docx` },

  // ==================== PEDOMAN (2 file) ====================
  { name: "BUKU PEDOMAN UKM PILAR BANGSA [NEW]", category: "Pedoman", type: "DOCX", path: `${BASE}/BUKU PEDOMAN UKM PILAR BANGSA/BUKU PEDOMAN UKM PILAR BANGSA [NEW].docx` },
  { name: "ROADMAP UKM PILAR BANGSA (PKM)", category: "Pedoman", type: "DOCX", path: `${BASE}/BUKU PEDOMAN UKM PILAR BANGSA/ROADMAP UKM PILAR BANGSA (PKM).docx` },

  // ==================== PROGRAM KERJA (1 file) ====================
  { name: "PROGRAM KERJA UTAMA DAN PENUNJANG 2025-2026", category: "Program Kerja", type: "DOCX", path: `${BASE}/PROGRAM KERJA/PROGRAM KERJA UTAMA DAN PENUNJANG 2025-2026.docx` },
];
