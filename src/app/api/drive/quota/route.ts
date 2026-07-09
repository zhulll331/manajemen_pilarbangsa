import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
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
      return NextResponse.json({ error: 'Gagal mendapatkan access token Google' }, { status: 500 });
    }

    const quotaResponse = await fetch(
      'https://www.googleapis.com/drive/v3/about?fields=storageQuota',
      {
        headers: {
          'Authorization': \Bearer \ + accessToken,
        }
      }
    );

    if (!quotaResponse.ok) {
      const errText = await quotaResponse.text();
      console.error('Google Drive quota error:', errText);
      return NextResponse.json({ error: 'Gagal mengambil kuota penyimpanan' }, { status: 500 });
    }

    const data = await quotaResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching drive quota:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengambil kuota penyimpanan' }, { status: 500 });
  }
}
