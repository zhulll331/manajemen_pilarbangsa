import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/utils/drive';

export async function POST(request: NextRequest) {
  try {
    const { fileUrl, fileId } = await request.json();

    let targetFileId = fileId;

    if (!targetFileId && fileUrl) {
      // Ekstrak ID dari URL Google Drive (mendukung format view, uc?id=ID, dan folder)
      const match = fileUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || 
                    fileUrl.match(/id=([a-zA-Z0-9_-]+)/) || 
                    fileUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        targetFileId = match[1];
      }
    }

    if (!targetFileId) {
      return NextResponse.json({ error: 'fileId or valid fileUrl is required' }, { status: 400 });
    }

    const drive = getDriveClient();

    // Lakukan penghapusan file di Google Drive
    await drive.files.delete({
      fileId: targetFileId,
      supportsAllDrives: true,
    });

    return NextResponse.json({ success: true, deletedFileId: targetFileId });
  } catch (error: any) {
    console.error('Error deleting file from Drive:', error);
    // Jika file sudah tidak ada (404), anggap sukses agar tidak memblokir penghapusan database
    if (error.status === 404 || (error.message && error.message.includes('File not found'))) {
      return NextResponse.json({ success: true, note: 'File already not found in Drive' });
    }
    return NextResponse.json({ error: error.message || 'Failed to delete file from Drive' }, { status: 500 });
  }
}
