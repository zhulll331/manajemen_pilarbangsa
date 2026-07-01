import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

/**
 * Membuat sesi upload resumable Google Drive langsung dari browser.
 * Browser akan mengupload file langsung ke Google Drive (tidak lewat Vercel),
 * sehingga tidak terkena batas ukuran/timeout Vercel Hobby tier.
 */
export async function POST(request: NextRequest) {
  try {
    const { fileName, mimeType, folderId } = await request.json();

    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }

    // Buat OAuth2 client langsung dari env vars
    const oauth2Client = new google.auth.OAuth2(
      process.env.DRIVE_CLIENT_ID,
      process.env.DRIVE_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.DRIVE_REFRESH_TOKEN,
    });

    // Ambil access token yang valid
    const tokenData = await oauth2Client.getAccessToken();
    const accessToken = tokenData.token;

    if (!accessToken) {
      return NextResponse.json({ error: 'Gagal mendapatkan access token Google' }, { status: 500 });
    }

    const parentId = folderId || process.env.NEXT_PUBLIC_DRIVE_PARENT_FOLDER_ID;

    // Inisiasi sesi upload resumable di Google Drive
    const initResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': mimeType || 'application/octet-stream',
        },
        body: JSON.stringify({
          name: fileName,
          parents: parentId ? [parentId] : [],
        }),
      }
    );

    if (!initResponse.ok) {
      const errText = await initResponse.text();
      console.error('Google Drive resumable session error:', errText);
      return NextResponse.json({ error: 'Gagal membuat sesi upload ke Google Drive' }, { status: 500 });
    }

    // URL sesi upload ada di header 'location'
    const uploadUrl = initResponse.headers.get('location');

    if (!uploadUrl) {
      return NextResponse.json({ error: 'Google Drive tidak mengembalikan URL sesi upload' }, { status: 500 });
    }

    return NextResponse.json({ uploadUrl });
  } catch (error: any) {
    console.error('Error creating upload session:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat sesi upload' }, { status: 500 });
  }
}
