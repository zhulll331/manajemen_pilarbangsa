import { compressImageIfNeeded } from './compressImage';

/**
 * Upload file ke Google Drive melalui server proxy.
 * Gambar dikompres otomatis sebelum upload untuk menghemat bandwidth.
 */
export async function uploadFileToDrive(
  file: File,
  folderId?: string,
  _onProgress?: (percent: number) => void
): Promise<{ url: string; downloadUrl: string; fileId: string; name: string }> {

  // Kompres gambar sebelum upload (PDF/Docx tidak berubah)
  const fileToUpload = await compressImageIfNeeded(file);

  // Upload melalui server proxy
  const formData = new FormData();
  formData.append('file', fileToUpload);
  if (folderId) formData.append('folderId', folderId);

  const res = await fetch('/api/drive/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Upload gagal (status ${res.status})`);
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  return {
    url: data.url || '',
    downloadUrl: data.url || '',
    fileId: data.fileId || '',
    name: data.name || file.name,
  };
}
