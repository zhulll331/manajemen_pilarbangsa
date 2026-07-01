import { compressImageIfNeeded } from './compressImage';

/**
 * Upload file ke Google Drive.
 * 
 * Alur:
 * 1. Minta sesi upload resumable dari server kita (ringan, hanya JSON)
 * 2. Browser upload langsung ke Google Drive (melewati Vercel, tanpa batas timeout/ukuran)
 * 3. CORS memblokir respons, tapi file sebenarnya sudah terupload
 * 4. Verifikasi lewat server kita apakah upload berhasil
 * 5. Jadikan file publik lewat server kita
 */
export async function uploadFileToDrive(
  file: File,
  folderId?: string,
  _onProgress?: (percent: number) => void
): Promise<{ url: string; downloadUrl: string; fileId: string; name: string }> {

  // Kompres gambar sebelum upload (PDF/Docx tidak berubah)
  const fileToUpload = await compressImageIfNeeded(file);

  // === Langkah 1: Dapatkan upload session URL dari server ===
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
  if (!uploadUrl) throw new Error('URL sesi upload tidak valid');

  // === Langkah 2: Upload langsung ke Google Drive dari browser ===
  // CORS akan memblokir pembacaan respons, tapi file tetap terupload!
  const contentRange = `bytes 0-${fileToUpload.size - 1}/${fileToUpload.size}`;

  try {
    await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': fileToUpload.type || 'application/octet-stream',
        'Content-Range': contentRange,
      },
      body: fileToUpload,
    });
  } catch {
    // CORS error diharapkan terjadi — abaikan saja, file sudah terupload
    console.log('[driveUpload] CORS error (diharapkan) — file sudah terupload, memverifikasi...');
  }

  // === Langkah 3: Verifikasi upload lewat server kita ===
  // Tunggu sebentar agar Google Drive selesai memproses
  await new Promise(r => setTimeout(r, 1500));

  const checkRes = await fetch('/api/drive/check-upload-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      uploadUrl, 
      fileSize: fileToUpload.size,
    }),
  });

  if (!checkRes.ok) {
    throw new Error('Gagal memverifikasi status upload');
  }

  const checkData = await checkRes.json();

  if (!checkData.completed || !checkData.fileId) {
    throw new Error('Upload ke Google Drive belum selesai atau gagal. Silakan coba lagi.');
  }

  const fileId = checkData.fileId;

  // === Langkah 4: Jadikan file publik ===
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
    name: checkData.name || fileToUpload.name,
  };
}
