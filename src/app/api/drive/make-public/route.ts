import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/utils/drive';

/**
 * Menjadikan file Google Drive publik setelah upload langsung dari browser.
 */
export async function POST(request: NextRequest) {
  try {
    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 });
    }

    const drive = getDriveClient();

    // Atur permission publik agar file bisa diakses siapa saja
    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true,
      });
    } catch (permErr: any) {
      console.warn('Catatan: Gagal mengatur permission publik:', permErr.message);
    }

    const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    return NextResponse.json({ url: directUrl, downloadUrl, fileId });
  } catch (error: any) {
    console.error('Error making file public:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengatur akses file' }, { status: 500 });
  }
}
