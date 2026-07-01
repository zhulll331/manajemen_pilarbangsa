import { compressImageIfNeeded } from './compressImage';

/**
 * Upload file langsung dari browser ke Google Drive (melewati Vercel).
 * 
 * Alur:
 * 1. Browser meminta sesi upload dari server kita (ringan, hanya JSON)
 * 2. Browser mengupload file langsung ke Google Drive menggunakan URL sesi
 * 3. Browser meminta server kita untuk menjadikan file publik
 * 
 * Keuntungan:
 * - Tidak terkena batas 4.5MB atau timeout 10 detik dari Vercel
 * - File besar (PDF, Docx, video) bisa diupload tanpa masalah
 * - Gambar tetap dikompres terlebih dahulu untuk efisiensi
 */
export async function uploadFileToDrive(
  file: File,
  folderId?: string,
  onProgress?: (percent: number) => void
): Promise<{ url: string; downloadUrl: string; fileId: string; name: string }> {

  // Kompres gambar sebelum upload (PDF/Docx tidak berubah)
  const fileToUpload = await compressImageIfNeeded(file);

  // Langkah 1: Dapatkan URL sesi upload dari server kita (sangat ringan)
  const sessionRes = await fetch('/api/drive/create-upload-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: fileToUpload.name,
      mimeType: fileToUpload.type || 'application/octet-stream',
      folderId,
    }),
  });

  if (!sessionRes.ok) {
    const errData = await sessionRes.json().catch(() => ({}));
    throw new Error(errData.error || 'Gagal membuat sesi upload');
  }

  const { uploadUrl } = await sessionRes.json();

  if (!uploadUrl) {
    throw new Error('URL sesi upload tidak valid');
  }

  // Langkah 2: Upload file langsung ke Google Drive dari browser
  // (Tidak melewati server Vercel, jadi tidak ada batas ukuran/timeout)
  let uploadRes: Response;

  if (onProgress) {
    // Upload dengan laporan progres menggunakan XMLHttpRequest
    uploadRes = await uploadWithProgress(fileToUpload, uploadUrl, onProgress);
  } else {
    uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': fileToUpload.type || 'application/octet-stream',
        'Content-Length': String(fileToUpload.size),
      },
      body: fileToUpload,
    });
  }

  if (!uploadRes.ok) {
    throw new Error(`Upload ke Google Drive gagal (status ${uploadRes.status})`);
  }

  const uploadData = await uploadRes.json();
  const fileId: string = uploadData.id;

  if (!fileId) {
    throw new Error('Google Drive tidak mengembalikan ID file');
  }

  // Langkah 3: Jadikan file publik melalui server kita
  const publicRes = await fetch('/api/drive/make-public', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId }),
  });

  const publicData = await publicRes.json();

  return {
    url: publicData.url || `https://drive.google.com/uc?export=view&id=${fileId}`,
    downloadUrl: publicData.downloadUrl || `https://drive.google.com/uc?export=download&id=${fileId}`,
    fileId,
    name: fileToUpload.name,
  };
}

/**
 * Upload file menggunakan XMLHttpRequest agar bisa memantau progres.
 */
function uploadWithProgress(
  file: File,
  uploadUrl: string,
  onProgress: (percent: number) => void
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      // Bungkus XHR response ke dalam Response API agar kompatibel
      const response = new Response(xhr.responseText, {
        status: xhr.status,
        statusText: xhr.statusText,
      });
      resolve(response);
    });

    xhr.addEventListener('error', () => reject(new Error('Koneksi terputus saat upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload dibatalkan')));

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.send(file);
  });
}
