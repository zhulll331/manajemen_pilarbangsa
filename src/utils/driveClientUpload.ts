import { compressImageIfNeeded } from './compressImage';

/**
 * Upload file langsung dari browser ke Google Drive (melewati Vercel).
 *
 * Strategi:
 * 1. Coba upload langsung ke Google Drive via resumable session (tidak ada batas Vercel)
 * 2. Jika gagal (misal CORS atau error lain), fallback ke proxy server /api/drive/upload
 */
export async function uploadFileToDrive(
  file: File,
  folderId?: string,
  onProgress?: (percent: number) => void
): Promise<{ url: string; downloadUrl: string; fileId: string; name: string }> {

  // Kompres gambar sebelum upload (PDF/Docx tidak berubah)
  const fileToUpload = await compressImageIfNeeded(file);

  // Coba direct upload ke Google Drive terlebih dahulu
  try {
    return await uploadViaResumable(fileToUpload, folderId, onProgress);
  } catch (directErr) {
    console.warn('[driveUpload] Direct upload gagal, fallback ke server proxy:', directErr);
    // Fallback ke server proxy (untuk file kecil atau jika CORS gagal)
    return await uploadViaServerProxy(fileToUpload, folderId);
  }
}

/**
 * Upload langsung dari browser ke Google Drive menggunakan resumable session.
 */
async function uploadViaResumable(
  file: File,
  folderId?: string,
  onProgress?: (percent: number) => void
): Promise<{ url: string; downloadUrl: string; fileId: string; name: string }> {

  // Langkah 1: Dapatkan URL sesi upload dari server kita
  const sessionRes = await fetch('/api/drive/create-upload-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      folderId,
    }),
  });

  if (!sessionRes.ok) {
    const errData = await sessionRes.json().catch(() => ({}));
    throw new Error(errData.error || 'Gagal membuat sesi upload');
  }

  const { uploadUrl } = await sessionRes.json();
  if (!uploadUrl) throw new Error('URL sesi upload tidak valid');

  // Langkah 2: Upload file langsung ke Google Drive
  // Content-Range wajib ada agar Google Drive tahu upload selesai dalam satu chunk
  const contentRange = `bytes 0-${file.size - 1}/${file.size}`;

  let uploadRes: Response;
  if (onProgress) {
    uploadRes = await uploadWithProgress(file, uploadUrl, contentRange, onProgress);
  } else {
    uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'Content-Range': contentRange,
      },
      body: file,
    });
  }

  // Google Drive mengembalikan 200 atau 201 saat upload selesai
  if (!uploadRes.ok && uploadRes.status !== 201) {
    throw new Error(`Upload Google Drive gagal (status ${uploadRes.status})`);
  }

  const uploadData = await uploadRes.json();
  const fileId: string = uploadData.id;
  if (!fileId) throw new Error('Google Drive tidak mengembalikan ID file');

  // Langkah 3: Jadikan file publik
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
    name: file.name,
  };
}

/**
 * Fallback: Upload melalui server proxy Vercel (untuk file kecil).
 */
async function uploadViaServerProxy(
  file: File,
  folderId?: string
): Promise<{ url: string; downloadUrl: string; fileId: string; name: string }> {
  const formData = new FormData();
  formData.append('file', file);
  if (folderId) formData.append('folderId', folderId);

  const res = await fetch('/api/drive/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload server proxy gagal (status ${res.status})`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  return {
    url: data.url || '',
    downloadUrl: data.url || '',
    fileId: data.fileId || '',
    name: file.name,
  };
}

/**
 * Upload file dengan pemantauan progres menggunakan XMLHttpRequest.
 */
function uploadWithProgress(
  file: File,
  uploadUrl: string,
  contentRange: string,
  onProgress: (percent: number) => void
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      resolve(new Response(xhr.responseText, {
        status: xhr.status,
        statusText: xhr.statusText,
      }));
    });

    xhr.addEventListener('error', () => reject(new Error('Koneksi terputus saat upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload dibatalkan')));

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.setRequestHeader('Content-Range', contentRange);
    xhr.send(file);
  });
}
