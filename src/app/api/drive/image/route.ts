import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/utils/drive';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new NextResponse('File ID is required', { status: 400 });
  }

  try {
    const drive = getDriveClient();
    
    // 1. Ambil metadata file untuk mengetahui MIME type aslinya
    const meta = await drive.files.get({
      fileId: id,
      fields: 'mimeType, name'
    });

    const contentType = meta.data.mimeType || 'image/jpeg';

    // 2. Ambil binary stream file langsung dari Google Drive API (bypass blokir CORS/Cookies Google)
    const response = await drive.files.get(
      { fileId: id, alt: 'media' },
      { responseType: 'arraybuffer' }
    );

    const buffer = Buffer.from(response.data as ArrayBuffer);

    // 3. Kembalikan raw buffer dengan Content-Type gambar asli ke browser
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error serving drive image proxy:', error.message || error);
    return new NextResponse('Failed to load image from Drive', { status: 500 });
  }
}
