import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/utils/drive';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folderId = formData.get('folderId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const drive = getDriveClient();
    const parentId = folderId || process.env.NEXT_PUBLIC_DRIVE_PARENT_FOLDER_ID;

    if (!parentId) {
      return NextResponse.json({ error: 'Destination folderId is not configured' }, { status: 500 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    const fileMetadata = {
      name: file.name,
      parents: [parentId],
    };

    const media = {
      mimeType: file.type || 'application/octet-stream',
      body: stream,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      supportsAllDrives: true,
      fields: 'id, name',
    });

    const fileId = response.data.id;

    // Pastikan file mendapatkan permission public (anyone with the link can view)
    // Hal ini sangat wajib agar foto pratinjau dapat langsung muncul di tag <img> tanpa terblokir Google CORS / otentikasi
    if (fileId) {
      try {
        await drive.permissions.create({
          fileId: fileId,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
          supportsAllDrives: true,
        });
      } catch (permErr: any) {
        console.warn('Catatan: Gagal mengatur permission public (mungkin dibatasi kebijakan Workspace/Shared Drive):', permErr.message);
      }
    }

    const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

    return NextResponse.json({ url: directUrl, fileId, name: response.data.name });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 });
  }
}
