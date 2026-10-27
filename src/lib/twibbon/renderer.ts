import type { TwibbonTransformState } from '@/types/twibbon';
import {
  type ExifOrientation,
  computeWorkingDimensions,
  getExifNormalizedDimensions,
} from './exif.ts';
import {
  TWIBBON_LOGICAL_HEIGHT,
  TWIBBON_LOGICAL_WIDTH,
  clampTransform,
  computePhotoMetrics,
} from './transform.ts';
import {
  type ParticipantPhotoValidationResult,
  validateParticipantDimensions,
  validateParticipantPhotoBytes,
} from './validation.ts';

export interface NormalizedParticipantPhoto {
  /** Kanvas kerja yang sudah dinormalisasi orientasi EXIF-nya dan dibatasi <= 2560px */
  canvas: HTMLCanvasElement;
  /** Lebar setelah normalisasi EXIF & working cap */
  width: number;
  /** Tinggi setelah normalisasi EXIF & working cap */
  height: number;
  /** Lebar asli setelah normalisasi EXIF */
  originalNormalizedWidth: number;
  /** Tinggi asli setelah normalisasi EXIF */
  originalNormalizedHeight: number;
  exifOrientation: ExifOrientation;
  lowQualityWarning: boolean;
  warningMessage?: string;
  dispose: () => void;
}

/**
 * Menerapkan matriks transformasi 2D untuk menormalisasi orientasi EXIF 1..8
 * pada kanvas tujuan berukuran (normW, normH) dari gambar mentah berukuran (rawW, rawH).
 */
export function applyExifContextTransform(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  orientation: ExifOrientation,
  rawWidth: number,
  rawHeight: number
): void {
  switch (orientation) {
    case 2:
      // Flip horizontal
      ctx.transform(-1, 0, 0, 1, rawWidth, 0);
      break;
    case 3:
      // Rotate 180°
      ctx.transform(-1, 0, 0, -1, rawWidth, rawHeight);
      break;
    case 4:
      // Flip vertical
      ctx.transform(1, 0, 0, -1, 0, rawHeight);
      break;
    case 5:
      // Transpose (flip horizontal + rotate 270° CW)
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      // Rotate 90° CW
      ctx.transform(0, 1, -1, 0, rawHeight, 0);
      break;
    case 7:
      // Transverse (flip horizontal + rotate 90° CW)
      ctx.transform(0, -1, -1, 0, rawHeight, rawWidth);
      break;
    case 8:
      // Rotate 270° CW (90° CCW)
      ctx.transform(0, -1, 1, 0, 0, rawWidth);
      break;
    case 1:
    default:
      ctx.transform(1, 0, 0, 1, 0, 0);
      break;
  }
}

/**
 * Satu fungsi renderer terpadu untuk Preview dan Ekspor PNG 1080x1080.
 * Sesuai PRD Bagian 10.3:
 * 1. Isi latar putih (#FFFFFF) di seluruh kanvas
 * 2. Gambar foto peserta yang sudah dinormalisasi & ditransformasi di ruang koordinat logis 1080x1080
 * 3. Gambar bingkai PNG transparan di lapisan paling atas (0, 0, W, H) tanpa rotasi/distorsi
 */
export function renderTwibbonComposite(params: {
  ctx: CanvasRenderingContext2D;
  photo: CanvasImageSource | null;
  photoWidth: number;
  photoHeight: number;
  frame: CanvasImageSource | null;
  transform: TwibbonTransformState;
  targetWidth?: number;
  targetHeight?: number;
}): TwibbonTransformState {
  const {
    ctx,
    photo,
    photoWidth,
    photoHeight,
    frame,
    transform,
    targetWidth = TWIBBON_LOGICAL_WIDTH,
    targetHeight = TWIBBON_LOGICAL_HEIGHT,
  } = params;

  const scaleX = targetWidth / TWIBBON_LOGICAL_WIDTH;
  const scaleY = targetHeight / TWIBBON_LOGICAL_HEIGHT;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Isi latar putih penuh agar transparansi pada foto peserta dipadukan di atas putih
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  let clampedTransform = transform;

  // 2. Gambar foto peserta di bawah bingkai
  if (photo && photoWidth > 0 && photoHeight > 0) {
    clampedTransform = clampTransform(
      transform,
      photoWidth,
      photoHeight,
      TWIBBON_LOGICAL_WIDTH,
      TWIBBON_LOGICAL_HEIGHT
    );
    const metrics = computePhotoMetrics(
      photoWidth,
      photoHeight,
      clampedTransform.rotation,
      clampedTransform.zoom,
      TWIBBON_LOGICAL_WIDTH,
      TWIBBON_LOGICAL_HEIGHT
    );

    const centerLogicalX = TWIBBON_LOGICAL_WIDTH / 2 + clampedTransform.tx;
    const centerLogicalY = TWIBBON_LOGICAL_HEIGHT / 2 + clampedTransform.ty;

    ctx.save();
    ctx.translate(centerLogicalX * scaleX, centerLogicalY * scaleY);
    ctx.rotate((clampedTransform.rotation * Math.PI) / 180);
    ctx.scale(metrics.finalScale * scaleX, metrics.finalScale * scaleY);
    ctx.drawImage(photo, -photoWidth / 2, -photoHeight / 2, photoWidth, photoHeight);
    ctx.restore();
  }

  // 3. Gambar bingkai resmi di lapisan teratas (0, 0, W, H)
  if (frame) {
    ctx.drawImage(frame, 0, 0, targetWidth, targetHeight);
  }

  ctx.restore();
  return clampedTransform;
}

/**
 * Memuat dan menormalisasi foto peserta di browser secara lokal (tanpa jaringan).
 * Menangani:
 * - Validasi byte, magic header, dimensi, dan batas 15 MiB
 * - Normalisasi EXIF orientasi 1..8 tepat satu kali
 * - Downsampling ke ukuran kerja maksimum 2560 px di sisi terpanjang (tidak meng-upscale foto kecil)
 * - Pembersihan ImageBitmap dan Object URL secara ketat
 */
export async function decodeAndNormalizeParticipantPhoto(
  file: File
): Promise<
  | { ok: true; data: NormalizedParticipantPhoto }
  | { ok: false; validation: ParticipantPhotoValidationResult }
> {
  if (!file || file.size <= 0) {
    return {
      ok: false,
      validation: {
        valid: false,
        errorCode: 'FILE_EMPTY',
        errorMessage: 'Foto belum bisa dibuka. Gunakan JPG, PNG, atau WebP.',
        lowQualityWarning: false,
        exifOrientation: 1,
      },
    };
  }

  if (file.size > 15 * 1024 * 1024) {
    return {
      ok: false,
      validation: {
        valid: false,
        errorCode: 'FILE_TOO_LARGE',
        errorMessage: 'Foto maksimal 15 MiB. Pilih foto yang lebih kecil.',
        lowQualityWarning: false,
        exifOrientation: 1,
      },
    };
  }

  let bytes: Uint8Array;
  try {
    // Baca hingga 256 KiB pertama untuk inspeksi header + EXIF tanpa menggandakan buffer 15 MiB penuh bila tidak perlu
    const headerSlice = file.slice(0, Math.min(file.size, 256 * 1024));
    bytes = new Uint8Array(await headerSlice.arrayBuffer());
  } catch {
    return {
      ok: false,
      validation: {
        valid: false,
        errorCode: 'DECODE_FAILED',
        errorMessage: 'Foto belum bisa dibuka. Gunakan JPG, PNG, atau WebP.',
        lowQualityWarning: false,
        exifOrientation: 1,
      },
    };
  }

  const initialValidation = validateParticipantPhotoBytes(bytes, file.size);
  if (!initialValidation.valid) {
    return { ok: false, validation: initialValidation };
  }

  const exifOrientation = initialValidation.exifOrientation || 1;
  let bitmap: ImageBitmap | null = null;
  let imgElement: HTMLImageElement | null = null;
  let objectUrl: string | null = null;
  let manualExifNeeded = false;

  try {
    if (typeof createImageBitmap === 'function') {
      try {
        // Minta piksel mentah tanpa orientasi otomatis agar kita menormalisasi orientasi EXIF 1..8 tepat satu kali
        bitmap = await createImageBitmap(file, { imageOrientation: 'none' });
        manualExifNeeded = true;
      } catch {
        // Fallback jika opsi imageOrientation: 'none' tidak didukung browser
        bitmap = await createImageBitmap(file);
        manualExifNeeded = false;
      }
    } else {
      objectUrl = URL.createObjectURL(file);
      imgElement = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image decode error'));
        img.src = objectUrl!;
      });
      manualExifNeeded = false;
    }

    const decodedW = bitmap ? bitmap.width : imgElement!.naturalWidth;
    const decodedH = bitmap ? bitmap.height : imgElement!.naturalHeight;

    // Jika manualExifNeeded = true, decodedW/H adalah dimensi mentah sebelum EXIF
    // Jika manualExifNeeded = false, browser modern sudah menerapkan EXIF orientation secara otomatis
    const effectiveExifForValidation: ExifOrientation = manualExifNeeded ? exifOrientation : 1;
    const dimValidation = validateParticipantDimensions(
      decodedW,
      decodedH,
      effectiveExifForValidation
    );

    if (!dimValidation.valid) {
      if (bitmap) bitmap.close();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      return { ok: false, validation: dimValidation };
    }

    const normDims = manualExifNeeded
      ? getExifNormalizedDimensions(decodedW, decodedH, exifOrientation)
      : { width: decodedW, height: decodedH };

    const workingDims = computeWorkingDimensions(normDims.width, normDims.height, 2560);

    const workCanvas = document.createElement('canvas');
    workCanvas.width = workingDims.width;
    workCanvas.height = workingDims.height;

    const ctx = workCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const source = (bitmap || imgElement)!;
    const scaleX = workingDims.width / normDims.width;
    const scaleY = workingDims.height / normDims.height;

    ctx.save();
    ctx.scale(scaleX, scaleY);
    if (manualExifNeeded && exifOrientation !== 1) {
      applyExifContextTransform(ctx, exifOrientation, decodedW, decodedH);
    }
    ctx.drawImage(source, 0, 0, decodedW, decodedH);
    ctx.restore();

    if (bitmap) {
      bitmap.close();
      bitmap = null;
    }
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }

    const dispose = () => {
      workCanvas.width = 0;
      workCanvas.height = 0;
    };

    return {
      ok: true,
      data: {
        canvas: workCanvas,
        width: workingDims.width,
        height: workingDims.height,
        originalNormalizedWidth: normDims.width,
        originalNormalizedHeight: normDims.height,
        exifOrientation,
        lowQualityWarning: dimValidation.lowQualityWarning,
        warningMessage: dimValidation.warningMessage,
        dispose,
      },
    };
  } catch {
    if (bitmap) {
      try {
        bitmap.close();
      } catch {
        // ignore
      }
    }
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    return {
      ok: false,
      validation: {
        valid: false,
        errorCode: 'DECODE_FAILED',
        errorMessage:
          'Foto ini terlalu berat untuk diproses di perangkatmu. Coba versi lebih kecil.',
        lowQualityWarning: false,
        exifOrientation,
      },
    };
  }
}

/**
 * Memuat gambar bingkai dengan crossOrigin='anonymous' dan memverifikasi bahwa bingkai
 * dapat digambar ke canvas tanpa mencemari origin (origin-clean untuk toBlob).
 */
export async function loadOriginCleanFrameImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Jika bukan data URL atau blob URL di origin yang sama, pasang crossOrigin anonymous
    if (!url.startsWith('data:') && !url.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      try {
        // Uji apakah gambar mencemari canvas (CORS check)
        const testCanvas = document.createElement('canvas');
        testCanvas.width = 4;
        testCanvas.height = 4;
        const testCtx = testCanvas.getContext('2d');
        if (testCtx) {
          testCtx.drawImage(img, 0, 0, 4, 4);
          // getImageData akan melempar SecurityError jika canvas tercemar CORS
          testCtx.getImageData(0, 0, 1, 1);
        }
        testCanvas.width = 0;
        testCanvas.height = 0;
        resolve(img);
      } catch {
        reject(
          new Error(
            'Bingkai tidak dapat diekspor karena pembatasan lintas domain (CORS). Hubungi panitia.'
          )
        );
      }
    };

    img.onerror = () => {
      reject(new Error('Bingkai belum berhasil dimuat. Coba lagi.'));
    };

    img.src = url;
  });
}

/**
 * Mengekspor hasil komposit tepat 1080 x 1080 PNG sebagai Blob.
 * Sesuai PRD Bagian 10.3: menggunakan canvas mandiri 1080x1080 dan toBlob('image/png').
 */
export async function exportTwibbonPngBlob(params: {
  photo: CanvasImageSource;
  photoWidth: number;
  photoHeight: number;
  frame: CanvasImageSource;
  transform: TwibbonTransformState;
}): Promise<Blob> {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = TWIBBON_LOGICAL_WIDTH;
  exportCanvas.height = TWIBBON_LOGICAL_HEIGHT;

  const ctx = exportCanvas.getContext('2d');
  if (!ctx) {
    exportCanvas.width = 0;
    exportCanvas.height = 0;
    throw new Error('Twibbon belum berhasil dibuat. Coba lagi.');
  }

  try {
    renderTwibbonComposite({
      ctx,
      photo: params.photo,
      photoWidth: params.photoWidth,
      photoHeight: params.photoHeight,
      frame: params.frame,
      transform: params.transform,
      targetWidth: TWIBBON_LOGICAL_WIDTH,
      targetHeight: TWIBBON_LOGICAL_HEIGHT,
    });

    const blob = await new Promise<Blob | null>((resolve, reject) => {
      try {
        exportCanvas.toBlob((b) => resolve(b), 'image/png');
      } catch (err) {
        reject(err);
      }
    });

    if (!blob || blob.size <= 0 || blob.type !== 'image/png') {
      throw new Error('Twibbon belum berhasil dibuat. Coba lagi.');
    }

    return blob;
  } finally {
    exportCanvas.width = 0;
    exportCanvas.height = 0;
  }
}

/**
 * Membuat bingkai PNG transparan 1080x1080 sintetis resmi UKM Pilar Bangsa
 * untuk Diklat Kepemimpinan 2026 (dapat digunakan sebagai bingkai contoh/demo
 * maupun diunduh oleh admin Humas untuk pengujian).
 */
export function createSampleDiklatFrameCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 1080, 1080);

  // Kita gambar bingkai di sekeliling luar dengan melubangi lingkaran/kubah tengah (globalCompositeOperation)
  // 1. Latar gradien bingkai merah marun & hitam khas Pilar Bangsa
  const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
  bgGrad.addColorStop(0, '#990B22');
  bgGrad.addColorStop(0.5, '#E31837');
  bgGrad.addColorStop(1, '#5A0410');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1080, 1080);

  // Ornamen geometris sudut emas & hijau
  ctx.fillStyle = '#008000';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(310, 0);
  ctx.lineTo(0, 310);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(1080, 0);
  ctx.lineTo(770, 0);
  ctx.lineTo(1080, 310);
  ctx.closePath();
  ctx.fill();

  // Garis aksen 3 warna di bagian paling atas
  ctx.fillStyle = '#E31837';
  ctx.fillRect(0, 0, 360, 16);
  ctx.fillStyle = '#008000';
  ctx.fillRect(360, 0, 360, 16);
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(720, 0, 360, 16);

  // Lubangi area tengah (lingkaran besar radius 365 di (540, 495)) agar transparan untuk foto peserta
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(540, 495, 365, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Cincin emas & putih mengelilingi lubang transparan
  ctx.save();
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(540, 495, 372, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(540, 495, 384, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Pill Header di atas
  ctx.save();
  ctx.fillStyle = '#111827';
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(190, 34, 700, 74, 37);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFD700';
  ctx.font = '800 25px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('UKM PILAR BANGSA • UNTAG BANYUWANGI', 540, 71);
  ctx.restore();

  // Pita bawah (Footer) untuk judul kegiatan
  ctx.save();
  const footerGrad = ctx.createLinearGradient(90, 820, 990, 1040);
  footerGrad.addColorStop(0, '#0F172A');
  footerGrad.addColorStop(1, '#1E293B');
  ctx.fillStyle = footerGrad;
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(80, 835, 920, 195, 32);
  ctx.fill();
  ctx.stroke();

  // Badge "SIAP MENGIKUTI"
  ctx.fillStyle = '#E31837';
  ctx.beginPath();
  ctx.roundRect(350, 812, 380, 46, 23);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SAYA SIAP MENGIKUTI', 540, 835);

  // Judul utama
  ctx.fillStyle = '#FFD700';
  ctx.font = '900 42px system-ui, -apple-system, sans-serif';
  ctx.fillText('DIKLAT KEPEMIMPINAN', 540, 902);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 28px system-ui, -apple-system, sans-serif';
  ctx.fillText('PERIODE 2026 / 2027', 540, 948);

  ctx.fillStyle = '#86EFAC';
  ctx.font = '600 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('Minggu, 1 November 2026 • Mondoluko Farm, Taman Suruh', 540, 992);
  ctx.restore();

  return canvas;
}

/**
 * Membuat ilustrasi foto peserta sintetis (tanpa data peserta nyata) untuk simulasi
 * pratinjau validasi bingkai di panel Admin Humas (PRD Bagian 7.2 & 10.1).
 */
export function createSampleParticipantSimulationCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d')!;

  const skyGrad = ctx.createLinearGradient(0, 0, 0, 1080);
  skyGrad.addColorStop(0, '#DBEAFE');
  skyGrad.addColorStop(1, '#EFF6FF');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 1080, 1080);

  // Siluet bahu & kepala netral di pusat area wajah
  ctx.fillStyle = '#1E3A8A';
  ctx.beginPath();
  ctx.arc(540, 780, 260, Math.PI, 0, false);
  ctx.closePath();
  ctx.fill();

  // Kerah almamater / jaket
  ctx.fillStyle = '#E31837';
  ctx.beginPath();
  ctx.moveTo(420, 620);
  ctx.lineTo(540, 760);
  ctx.lineTo(660, 620);
  ctx.closePath();
  ctx.fill();

  // Wajah siluet ramah
  ctx.fillStyle = '#FDE68A';
  ctx.beginPath();
  ctx.arc(540, 440, 130, 0, Math.PI * 2);
  ctx.fill();

  // Garis bantu tengah untuk pengecekan ruang wajah admin
  ctx.strokeStyle = 'rgba(30, 58, 138, 0.22)';
  ctx.setLineDash([10, 10]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(540, 160);
  ctx.lineTo(540, 820);
  ctx.moveTo(200, 480);
  ctx.lineTo(880, 480);
  ctx.stroke();

  return canvas;
}
