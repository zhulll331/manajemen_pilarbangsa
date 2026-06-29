import { google } from 'googleapis';
import path from 'path';

// Inisialisasi Google Auth & Drive client (Mendukung OAuth2 Refresh Token dan Service Account)
export function getDriveClient() {
  // 1. Prioritas Utama: Menggunakan OAuth2 Refresh Token (Untuk akun Gmail gratis 15GB agar tidak terkendala kuota Service Account)
  if (process.env.DRIVE_CLIENT_ID && process.env.DRIVE_CLIENT_SECRET && process.env.DRIVE_REFRESH_TOKEN) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.DRIVE_CLIENT_ID,
      process.env.DRIVE_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.DRIVE_REFRESH_TOKEN,
    });
    return google.drive({ version: 'v3', auth: oauth2Client });
  }

  // 2. Fallback: Menggunakan Service Account (Hanya berfungsi untuk pembuatan folder, atau upload ke Shared Drive / Workspace)
  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(process.cwd(), 'pilarbangsa-management-032c5eb4bbfd.json'),
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
}
