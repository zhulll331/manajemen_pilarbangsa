/**
 * Kompres file gambar di sisi klien (browser) sebelum diunggah ke server.
 * Untuk file non-gambar (PDF, Word, dll), file dikembalikan apa adanya.
 * 
 * @param file File asli dari input
 * @param maxSizeMB Ukuran maksimum target dalam MB (default 3MB)
 * @param maxWidthOrHeight Resolusi maksimum gambar (default 1920px)
 * @returns File yang sudah dikompres (atau file asli jika bukan gambar)
 */
export async function compressImageIfNeeded(
  file: File,
  maxSizeMB: number = 3,
  maxWidthOrHeight: number = 1920
): Promise<File> {
  // Hanya kompres file gambar
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Jika gambar sudah kecil, tidak perlu dikompres
  if (file.size <= maxSizeBytes) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Hitung ulang dimensi agar tidak melebihi batas
      if (width > height) {
        if (width > maxWidthOrHeight) {
          height = Math.round(height * maxWidthOrHeight / width);
          width = maxWidthOrHeight;
        }
      } else {
        if (height > maxWidthOrHeight) {
          width = Math.round(width * maxWidthOrHeight / height);
          height = maxWidthOrHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file); // fallback ke file asli jika canvas gagal
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Kompres dengan kualitas bertingkat (mulai dari 0.85, turun sampai 0.5)
      let quality = 0.85;
      const compress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            if (blob.size <= maxSizeBytes || quality <= 0.5) {
              // Sudah cukup kecil, bungkus kembali ke File
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              // Kurangi kualitas dan coba lagi
              quality -= 0.1;
              compress();
            }
          },
          'image/jpeg',
          quality
        );
      };
      compress();
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // fallback jika gambar gagal dimuat
    };

    img.src = objectUrl;
  });
}

/**
 * Validasi ukuran file sebelum upload.
 * Mengembalikan pesan error jika terlalu besar, atau null jika OK.
 */
export function validateFileSize(file: File, maxSizeMB: number = 4): string | null {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
    return `Ukuran file (${fileSizeMB} MB) melebihi batas ${maxSizeMB} MB. Untuk foto, gambar akan dikompres otomatis. Untuk PDF/Word, harap kompres secara manual terlebih dahulu.`;
  }
  return null;
}

/**
 * Mengonversi gambar jenis apapun (PNG, JPG, JPEG, BMP, GIF, dll.) ke format WebP
 * dan mengompresnya secara efisien dengan target resolusi maksimal dan kualitas adaptif.
 *
 * @param file File gambar yang diunggah pengguna
 * @param maxWidthOrHeight Resolusi batas sisi terpanjang (default 1920px untuk banner HD)
 * @param maxQuality Kualitas awal WebP (default 0.82)
 * @param targetMaxSizeBytes Target ukuran berkas maksimal (default 450KB)
 * @returns File terkompresi dengan mime image/webp dan ekstensi .webp
 */
export async function convertAndCompressToWebP(
  file: File,
  maxWidthOrHeight: number = 1920,
  maxQuality: number = 0.82,
  targetMaxSizeBytes: number = 450 * 1024
): Promise<File> {
  // Hanya proses jika file adalah gambar
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Pertahankan aspect ratio jika melebihi maxWidthOrHeight
      if (width > height) {
        if (width > maxWidthOrHeight) {
          height = Math.round((height * maxWidthOrHeight) / width);
          width = maxWidthOrHeight;
        }
      } else {
        if (height > maxWidthOrHeight) {
          width = Math.round((width * maxWidthOrHeight) / height);
          height = maxWidthOrHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Bersihkan nama file dan ubah ekstensi jadi .webp
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const cleanBaseName = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      const outputFilename = `${cleanBaseName}.webp`;

      let currentQuality = maxQuality;

      const attemptCompression = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Jika ukuran sudah di bawah target atau batas kualitas minimum (0.45)
            if (blob.size <= targetMaxSizeBytes || currentQuality <= 0.45) {
              const webpFile = new File([blob], outputFilename, {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(webpFile);
            } else {
              currentQuality -= 0.1;
              attemptCompression();
            }
          },
          'image/webp',
          currentQuality
        );
      };

      attemptCompression();
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

