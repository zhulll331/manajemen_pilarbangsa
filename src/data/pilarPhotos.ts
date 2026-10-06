import type { StaticImageData } from 'next/image'
import outdoor from '@/assets/moments/20260822_103154.webp'
import classroom from '@/assets/moments/IMG_20260131_073634.webp'
import practice from '@/assets/moments/20251213_091652.webp'
import crafts from '@/assets/moments/IMG_1228.webp'
import gathering from '@/assets/moments/IMG_20260502_093255.webp'
import whiteboard from '@/assets/moments/IMG_1339.webp'
import participants from '@/assets/moments/20260110_102303.webp'
import wideClassroom from '@/assets/moments/IMG20260418073938.webp'

export interface PilarPhoto {
  id: string
  src: StaticImageData
  alt: string
  rotation: number
  objectPosition: string
}

// Crop positions were checked against the full, orientation-corrected originals.
export const pilarPhotos: readonly PilarPhoto[] = [
  { id: 'outdoor', src: outdoor, alt: 'Anak-anak dan pendamping berkegiatan di halaman dengan kerucut kuning.', rotation: -3, objectPosition: '50% 50%' },
  { id: 'classroom', src: classroom, alt: 'Anak-anak menulis di meja kelas sementara pendamping menulis di papan tulis.', rotation: 2, objectPosition: '38% 50%' },
  { id: 'practice', src: practice, alt: 'Dua peserta mempraktikkan penggunaan botol plastik dan galon di dekat tanaman.', rotation: -4, objectPosition: '40% 50%' },
  { id: 'crafts', src: crafts, alt: 'Anak-anak dan pendamping membuat bentuk dari kertas berwarna di lantai.', rotation: 4, objectPosition: '50% 8%' },
  { id: 'gathering', src: gathering, alt: 'Peserta duduk bersama di atas karpet merah menghadap pendamping.', rotation: -2, objectPosition: '56% 50%' },
  { id: 'whiteboard', src: whiteboard, alt: 'Pendamping dan dua anak mengamati bagan di papan tulis.', rotation: 3, objectPosition: '50% 90%' },
  { id: 'participants', src: participants, alt: 'Beberapa peserta berdiri bersama di dalam ruangan, dengan tanaman dalam wadah galon di depan mereka.', rotation: -3, objectPosition: '30% 50%' },
  { id: 'wide-classroom', src: wideClassroom, alt: 'Suasana kelas dengan anak-anak di bangku kayu dan dua pendamping di depan papan tulis.', rotation: 2, objectPosition: '18% 50%' },
]
