import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

/**
 * Cek status upload resumable Google Drive.
 * Dipanggil setelah browser langsung PUT ke Google Drive tapi CORS memblokir response.
 * Server kita yang cek status-nya dan mengembalikan file ID jika upload berhasil.
 */
export async function POST(request: NextRequest) {
  try {
    const { uploadUrl, fileSize } = await request.json();

    if (!uploadUrl) {
      return NextResponse.json({ error: 'uploadUrl is required' }, { status: 400 });
    }

    // Buat OAuth2 client untuk mendapatkan access token
    const oauth2Client = new google.auth.OAuth2(
      process.env.DRIVE_CLIENT_ID,
      process.env.DRIVE_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.DRIVE_REFRESH_TOKEN,
    });

    const tokenData = await oauth2Client.getAccessToken();
    const accessToken = tokenData.token;

    if (!accessToken) {
      return NextResponse.json({ error: 'Gagal mendapatkan access token' }, { status: 500 });
    }

    // Cek status upload dengan mengirim request kosong ke session URL
    // Google Drive akan merespon:
    // - 200/201: Upload selesai, body berisi metadata file
    // - 308: Upload belum selesai
    // - 404: Session expired
    const checkRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Range': `bytes */${fileSize}`,
        'Content-Length': '0',
      },
    });

    if (checkRes.status === 200 || checkRes.status === 201) {
      // Upload sudah selesai! Ambil file ID dari response
      const fileData = await checkRes.json();
      return NextResponse.json({ 
        completed: true, 
        fileId: fileData.id,
        name: fileData.name,
      });
    } else if (checkRes.status === 308) {
      // Upload masih berlangsung / belum selesai
      return NextResponse.json({ completed: false, status: 'in_progress' });
    } else {
      const errText = await checkRes.text().catch(() => '');
      return NextResponse.json({ 
        completed: false, 
        status: 'error',
        error: `Status ${checkRes.status}: ${errText}` 
      });
    }
  } catch (error: any) {
    console.error('Error checking upload status:', error);
    return NextResponse.json({ error: error.message || 'Gagal cek status upload' }, { status: 500 });
  }
}
